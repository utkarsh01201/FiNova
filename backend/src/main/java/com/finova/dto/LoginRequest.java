package com.finova.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Username, email, or phone number is required")
    private String usernameOrEmailOrPhone;

    @NotBlank(message = "Password is required")
    private String password;
}
