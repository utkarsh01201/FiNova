package com.finova.dto;

import com.finova.entity.KycStatus;
import com.finova.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long id;
    private String username;
    private String email;
    private String phoneNumber;
    private String fullName;
    private String profilePictureUrl;
    private KycStatus kycStatus;
    private UserStatus status;
    private Boolean hasTransactionPin;
    private String aadhaarMasked;
    private String panMasked;
    private String kycDocumentUrl;
    private Set<String> roles;
    private LocalDateTime createdAt;
}
