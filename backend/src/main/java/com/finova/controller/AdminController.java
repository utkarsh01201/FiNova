package com.finova.controller;

import com.finova.dto.*;
import com.finova.entity.UserStatus;
import com.finova.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AdminAnalyticsDto>> getSystemAnalytics() {
        AdminAnalyticsDto analytics = adminService.getSystemAnalytics();
        return ResponseEntity.ok(ApiResponse.success("System analytics retrieved", analytics));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> getAllUsers(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        PageResponse<UserDto> users = adminService.getAllUsers(page, size);
        return ResponseEntity.ok(ApiResponse.success("User accounts retrieved", users));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserDto>> updateUserStatus(
            @PathVariable("id") Long userId,
            @RequestParam("status") UserStatus status) {
        UserDto updated = adminService.updateUserAccountStatus(userId, status);
        return ResponseEntity.ok(ApiResponse.success("User account status updated to " + status, updated));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<PageResponse<TransactionDto>>> getAllSystemTransactions(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        PageResponse<TransactionDto> transactions = adminService.getAllSystemTransactions(page, size);
        return ResponseEntity.ok(ApiResponse.success("System transaction ledger retrieved", transactions));
    }
}
