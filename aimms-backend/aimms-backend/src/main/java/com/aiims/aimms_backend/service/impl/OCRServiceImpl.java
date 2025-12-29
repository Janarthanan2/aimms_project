package com.aiims.aimms_backend.service.impl;

import com.aiims.aimms_backend.dto.ReceiptDTO;
import com.aiims.aimms_backend.service.OCRService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import reactor.netty.http.client.HttpClient;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;

import java.io.IOException;

@Service
public class OCRServiceImpl implements OCRService {

    private final WebClient webClient;
    private final com.aiims.aimms_backend.repository.UserRepository userRepo;
    private final com.aiims.aimms_backend.repository.ReceiptRepository receiptRepo;

    public OCRServiceImpl(WebClient.Builder webClientBuilder,
            com.aiims.aimms_backend.repository.UserRepository userRepo,
            com.aiims.aimms_backend.repository.ReceiptRepository receiptRepo,
            @org.springframework.beans.factory.annotation.Value("${model.service.url}") String modelServiceUrl) {
        System.out.println("Initializing OCRServiceImpl with Model URL: " + modelServiceUrl);

        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofMinutes(5))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(300))
                        .addHandlerLast(new WriteTimeoutHandler(300)));

        this.webClient = webClientBuilder
                .baseUrl(modelServiceUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();

        this.userRepo = userRepo;
        this.receiptRepo = receiptRepo;
    }

    @Override
    public Mono<ReceiptDTO> extractReceiptData(MultipartFile file, String userEmail) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        try {
            builder.part("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            }).header("Content-Disposition", "form-data; name=file; filename=" + file.getOriginalFilename());
        } catch (IOException e) {
            return Mono.error(new RuntimeException("Failed to read file bytes", e));
        }

        // Save file locally to get a path
        String imagePath = "uploads/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(imagePath);
            java.nio.file.Files.createDirectories(path.getParent());
            java.nio.file.Files.write(path, file.getBytes());
        } catch (IOException e) {
            System.err.println("Failed to save image locally: " + e.getMessage());
            imagePath = "unknown.jpg"; // Fallback to avoid DB error
        }
        final String savedPath = imagePath;

        return webClient.post()
                .uri("/extract/receipt")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(ReceiptDTO.class)
                .flatMap(dto -> {
                    // Async save to DB using a bounded elastic scheduler to avoid blocking Netty
                    return Mono.fromRunnable(() -> saveReceipt(dto, userEmail, savedPath))
                            .subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic())
                            .then(Mono.just(dto));
                });
    }

    // Persist data to MySQL
    public void saveReceipt(ReceiptDTO dto, String userEmail, String imagePath) {
        try {
            com.aiims.aimms_backend.model.User user = userRepo.findByEmail(userEmail).orElse(null);
            if (user == null) {
                System.err.println("User not found for email: " + userEmail);
                return;
            }

            com.aiims.aimms_backend.model.Receipt receipt = new com.aiims.aimms_backend.model.Receipt();
            receipt.setUser(user);
            receipt.setMerchant(dto.getMerchantName());
            receipt.setTotalAmount(dto.getTotalAmount());
            receipt.setOcrConfidence(0.95);
            receipt.setExtractedText(dto.getRawText() != null ? dto.getRawText().toString() : "");
            receipt.setProcessed(true);
            receipt.setImagePath(imagePath); // Set the required field

            // Date parsing safe-guard
            if (dto.getDate() != null) {
                try {
                    // Try standard formats
                    java.time.LocalDate date = java.time.LocalDate.parse(dto.getDate(),
                            java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    receipt.setReceiptDate(date.atStartOfDay());
                } catch (Exception e) {
                    // ignore parse error, keep null
                }
            }

            receiptRepo.save(receipt);
            System.out.println("Receipt saved successfully for user: " + userEmail);

        } catch (Exception e) {
            System.err.println("Failed to save receipt: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
