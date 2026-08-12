package com.finova.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrCodeResponse {

    private String qrCodeString; // finova://pay?username=userA&walletUuid=...
    private String username;
    private String fullName;
    private String walletUuid;
}
