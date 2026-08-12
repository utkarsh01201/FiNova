package com.finova.controller;

import com.finova.dto.ApiResponse;
import com.finova.dto.QrCodeResponse;
import com.finova.dto.ScanQrRequest;
import com.finova.dto.UserDto;
import com.finova.security.CurrentUser;
import com.finova.security.UserPrincipal;
import com.finova.service.QrCodeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/qr")
public class QrCodeController {

    @Autowired
    private QrCodeService qrCodeService;

    @GetMapping("/generate")
    public ResponseEntity<ApiResponse<QrCodeResponse>> generateQrCode(@CurrentUser UserPrincipal currentUser) {
        QrCodeResponse response = qrCodeService.generateQrCode(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("QR code generated", response));
    }

    @PostMapping("/scan")
    public ResponseEntity<ApiResponse<UserDto>> scanQrCode(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody ScanQrRequest scanQrRequest) {
        UserDto recipient = qrCodeService.scanAndResolveQrCode(scanQrRequest);
        return ResponseEntity.ok(ApiResponse.success("QR payload scanned and recipient resolved", recipient));
    }
}
