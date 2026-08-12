package com.finova.service.impl;

import com.finova.dto.QrCodeResponse;
import com.finova.dto.ScanQrRequest;
import com.finova.dto.UserDto;
import com.finova.entity.Role;
import com.finova.entity.User;
import com.finova.entity.Wallet;
import com.finova.exception.BadRequestException;
import com.finova.exception.ResourceNotFoundException;
import com.finova.repository.UserRepository;
import com.finova.repository.WalletRepository;
import com.finova.service.QrCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class QrCodeServiceImpl implements QrCodeService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Override
    public QrCodeResponse generateQrCode(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));

        String qrString = String.format("finova://pay?userId=%d&username=%s&walletUuid=%s",
                user.getId(), user.getUsername(), wallet.getWalletUuid());

        return QrCodeResponse.builder()
                .qrCodeString(qrString)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .walletUuid(wallet.getWalletUuid())
                .build();
    }

    @Override
    public UserDto scanAndResolveQrCode(ScanQrRequest scanQrRequest) {
        String payload = scanQrRequest.getQrCodeString();
        if (payload == null || !payload.startsWith("finova://pay?")) {
            throw new BadRequestException("Invalid Finova QR Code payload format");
        }

        try {
            String query = payload.substring("finova://pay?".length());
            String[] params = query.split("&");
            Long extractedUserId = null;
            String extractedUsername = null;

            for (String param : params) {
                String[] pair = param.split("=");
                if (pair.length == 2) {
                    if ("userId".equalsIgnoreCase(pair[0])) {
                        extractedUserId = Long.parseLong(pair[1]);
                    } else if ("username".equalsIgnoreCase(pair[0])) {
                        extractedUsername = pair[1];
                    }
                }
            }

            final Long finalUserId = extractedUserId;
            final String finalUsername = extractedUsername;

            User user;
            if (finalUserId != null) {
                user = userRepository.findById(finalUserId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", finalUserId));
            } else if (finalUsername != null) {
                user = userRepository.findByUsername(finalUsername)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "username", finalUsername));
            } else {
                throw new BadRequestException("Could not extract user details from QR code");
            }

            return UserDto.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .phoneNumber(user.getPhoneNumber())
                    .fullName(user.getFullName())
                    .profilePictureUrl(user.getProfilePictureUrl())
                    .kycStatus(user.getKycStatus())
                    .status(user.getStatus())
                    .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                    .createdAt(user.getCreatedAt())
                    .build();

        } catch (Exception e) {
            throw new BadRequestException("Failed to scan QR code: " + e.getMessage());
        }
    }
}
