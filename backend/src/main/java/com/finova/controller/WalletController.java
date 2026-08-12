package com.finova.controller;

import com.finova.dto.AddMoneyRequest;
import com.finova.dto.ApiResponse;
import com.finova.dto.TransactionDto;
import com.finova.dto.WalletDto;
import com.finova.dto.WithdrawToBankRequest;
import com.finova.security.CurrentUser;
import com.finova.security.UserPrincipal;
import com.finova.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @GetMapping
    public ResponseEntity<ApiResponse<WalletDto>> getWallet(@CurrentUser UserPrincipal currentUser) {
        WalletDto wallet = walletService.getWalletByUserId(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Wallet details retrieved successfully", wallet));
    }

    @PostMapping("/add-money")
    public ResponseEntity<ApiResponse<TransactionDto>> addMoney(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody AddMoneyRequest request) {
        TransactionDto transaction = walletService.addMoney(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Funds added to wallet successfully", transaction));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<TransactionDto>> withdrawToBank(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody WithdrawToBankRequest request) {
        TransactionDto transaction = walletService.withdrawToBank(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Withdrawal to bank account completed successfully", transaction));
    }
}

