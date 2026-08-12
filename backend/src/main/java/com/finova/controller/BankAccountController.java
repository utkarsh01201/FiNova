package com.finova.controller;

import com.finova.dto.*;
import com.finova.security.CurrentUser;
import com.finova.security.UserPrincipal;
import com.finova.service.BankAccountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bank")
public class BankAccountController {

    @Autowired
    private BankAccountService bankAccountService;

    @PostMapping("/link")
    public ResponseEntity<ApiResponse<BankAccountDto>> linkBankAccount(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody LinkBankRequest request) {
        BankAccountDto bankAccount = bankAccountService.linkBankAccount(currentUser.getId(), request);
        return new ResponseEntity<>(ApiResponse.success("Bank account linked successfully with UPI ID", bankAccount), HttpStatus.CREATED);
    }

    @GetMapping("/accounts")
    public ResponseEntity<ApiResponse<List<BankAccountDto>>> getUserBankAccounts(@CurrentUser UserPrincipal currentUser) {
        List<BankAccountDto> accounts = bankAccountService.getUserBankAccounts(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("User bank accounts retrieved", accounts));
    }

    @PostMapping("/check-balance")
    public ResponseEntity<ApiResponse<BankAccountDto>> checkBalance(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody CheckBalanceRequest request) {
        BankAccountDto account = bankAccountService.checkBalanceWithUpiPin(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("UPI PIN verified. Balance retrieved", account));
    }

    @PutMapping("/accounts/{id}/primary")
    public ResponseEntity<ApiResponse<BankAccountDto>> setPrimaryBankAccount(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable("id") Long bankAccountId) {
        BankAccountDto account = bankAccountService.setPrimaryBankAccount(currentUser.getId(), bankAccountId);
        return ResponseEntity.ok(ApiResponse.success("Primary bank account updated", account));
    }

    @PostMapping("/upi-send")
    public ResponseEntity<ApiResponse<TransactionDto>> sendMoneyViaUpi(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody UpiSendMoneyRequest request) {
        TransactionDto transaction = bankAccountService.sendMoneyViaUpi(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("UPI Payment completed successfully", transaction));
    }
}
