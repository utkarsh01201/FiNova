package com.finova.controller;

import com.finova.dto.*;
import com.finova.entity.RequestStatus;
import com.finova.security.CurrentUser;
import com.finova.security.UserPrincipal;
import com.finova.service.MoneyRequestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/requests")
public class MoneyRequestController {

    @Autowired
    private MoneyRequestService moneyRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<MoneyRequestDto>> createMoneyRequest(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody CreateMoneyRequest request) {
        MoneyRequestDto createdRequest = moneyRequestService.createRequest(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Money request created successfully", createdRequest));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MoneyRequestDto>>> getUserRequests(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) RequestStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        PageResponse<MoneyRequestDto> response = moneyRequestService.getUserRequests(currentUser.getId(), type, status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Money requests retrieved", response));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<TransactionDto>> acceptMoneyRequest(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable("id") Long requestId) {
        TransactionDto transaction = moneyRequestService.acceptRequest(currentUser.getId(), requestId);
        return ResponseEntity.ok(ApiResponse.success("Money request accepted and payment completed", transaction));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<MoneyRequestDto>> rejectMoneyRequest(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable("id") Long requestId) {
        MoneyRequestDto updatedRequest = moneyRequestService.rejectRequest(currentUser.getId(), requestId);
        return ResponseEntity.ok(ApiResponse.success("Money request rejected", updatedRequest));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<MoneyRequestDto>> cancelMoneyRequest(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable("id") Long requestId) {
        MoneyRequestDto updatedRequest = moneyRequestService.cancelRequest(currentUser.getId(), requestId);
        return ResponseEntity.ok(ApiResponse.success("Money request cancelled", updatedRequest));
    }
}
