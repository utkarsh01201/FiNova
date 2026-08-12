package com.finova.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ScanQrRequest {

    @NotBlank(message = "QR payload string is required")
    private String qrCodeString;
}
