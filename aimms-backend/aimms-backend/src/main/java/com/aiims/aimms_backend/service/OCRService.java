package com.aiims.aimms_backend.service;

import com.aiims.aimms_backend.dto.ReceiptDTO;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

public interface OCRService {
    Mono<ReceiptDTO> extractReceiptData(MultipartFile file, String userEmail);
}
