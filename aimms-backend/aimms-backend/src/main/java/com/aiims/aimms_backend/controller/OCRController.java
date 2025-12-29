package com.aiims.aimms_backend.controller;

import com.aiims.aimms_backend.dto.ReceiptDTO;
import com.aiims.aimms_backend.service.OCRService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/ocr")
@CrossOrigin(origins = "http://localhost:5173") // Allow frontend access
public class OCRController {

    private final OCRService ocrService;

    public OCRController(OCRService ocrService) {
        this.ocrService = ocrService;
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public Mono<ResponseEntity<ReceiptDTO>> uploadReceipt(@RequestParam("file") MultipartFile file,
            java.security.Principal principal) {
        System.out.println("OCR Controller: Received upload request from "
                + (principal != null ? principal.getName() : "Anonymous"));
        String email = principal != null ? principal.getName() : "anonymous@aimms.com";
        return ocrService.extractReceiptData(file, email)
                .map(ResponseEntity::ok)
                .doOnError(e -> {
                    System.err.println("OCR Controller Error: " + e.getMessage());
                    e.printStackTrace();
                })
                .defaultIfEmpty(ResponseEntity.badRequest().build());
    }
}
