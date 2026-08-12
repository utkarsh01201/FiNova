package com.finova.controller;

import com.finova.dto.ApiResponse;
import com.finova.dto.SetPinRequest;
import com.finova.dto.UpdateProfileRequest;
import com.finova.dto.UserDto;
import com.finova.entity.KycStatus;
import com.finova.security.CurrentUser;
import com.finova.security.UserPrincipal;
import com.finova.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getProfile(@CurrentUser UserPrincipal currentUser) {
        UserDto profile = userService.getProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserDto updatedProfile = userService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updatedProfile));
    }

    @PostMapping("/kyc/verify")
    public ResponseEntity<ApiResponse<UserDto>> submitKycVerification(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody com.finova.dto.KycSubmitRequest request) {
        UserDto updatedUser = userService.submitKyc(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Aadhaar & PAN KYC verification completed successfully", updatedUser));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserDto>>> searchUsers(@RequestParam("q") String query) {
        List<UserDto> results = userService.searchUsers(query);
        return ResponseEntity.ok(ApiResponse.success("User search completed", results));
    }

    @PostMapping("/pin")
    public ResponseEntity<ApiResponse<UserDto>> setTransactionPin(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody SetPinRequest request) {
        UserDto updatedUser = userService.setTransactionPin(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Secret 4-digit Payment PIN set successfully", updatedUser));
    }

    @GetMapping("/has-pin")
    public ResponseEntity<ApiResponse<Boolean>> hasTransactionPin(@CurrentUser UserPrincipal currentUser) {
        boolean hasPin = userService.hasTransactionPin(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("PIN status retrieved", hasPin));
    }
}
