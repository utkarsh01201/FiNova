package com.finova.service.impl;

import com.finova.dto.KycSubmitRequest;
import com.finova.dto.SetPinRequest;
import com.finova.dto.UpdateProfileRequest;
import com.finova.dto.UserDto;
import com.finova.entity.KycStatus;
import com.finova.entity.Role;
import com.finova.entity.User;
import com.finova.entity.UserStatus;
import com.finova.exception.BadRequestException;
import com.finova.exception.ResourceNotFoundException;
import com.finova.repository.UserRepository;
import com.finova.service.NotificationService;
import com.finova.service.UserService;
import com.finova.entity.NotificationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NotificationService notificationService;

    @Override
    public UserDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapToUserDto(user);
    }

    @Override
    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getPhoneNumber() != null && !request.getPhoneNumber().equals(user.getPhoneNumber())) {
            if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
                throw new BadRequestException("Phone number '" + request.getPhoneNumber() + "' is already in use by another account");
            }
            user.setPhoneNumber(request.getPhoneNumber());
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }

        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl());
        }

        User updatedUser = userRepository.save(user);
        return mapToUserDto(updatedUser);
    }

    @Override
    @Transactional
    public UserDto submitKyc(Long userId, KycSubmitRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String pan = request.getPanNumber().toUpperCase().trim();
        String aadhaar = request.getAadhaarNumber().trim();

        user.setAadhaarNumber(aadhaar);
        user.setPanNumber(pan);

        if (request.getLivePhotoData() != null && !request.getLivePhotoData().isBlank()) {
            user.setKycDocumentUrl(request.getLivePhotoData());
        }

        user.setKycStatus(KycStatus.VERIFIED);
        User saved = userRepository.save(user);

        notificationService.sendNotification(user, "KYC Verification Approved",
                "Your Aadhaar and PAN KYC verification has been verified and approved.", NotificationType.SYSTEM);

        return mapToUserDto(saved);
    }

    @Override
    @Transactional
    public UserDto updateUserStatus(Long userId, UserStatus userStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setStatus(userStatus);
        return mapToUserDto(userRepository.save(user));
    }

    @Override
    public List<UserDto> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        String searchQuery = query.trim();
        return userRepository.findAll().stream()
                .filter(u -> u.getUsername().toLowerCase().contains(searchQuery.toLowerCase()) ||
                             u.getEmail().toLowerCase().contains(searchQuery.toLowerCase()) ||
                             u.getPhoneNumber().contains(searchQuery) ||
                             u.getFullName().toLowerCase().contains(searchQuery.toLowerCase()))
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserDto setTransactionPin(Long userId, SetPinRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setTransactionPinHash(passwordEncoder.encode(request.getPin()));
        User updated = userRepository.save(user);

        notificationService.sendNotification(user, "Payment PIN Updated",
                "Your secret 4-digit Payment PIN has been configured successfully.", NotificationType.SYSTEM);

        return mapToUserDto(updated);
    }

    @Override
    public boolean hasTransactionPin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return user.getTransactionPinHash() != null && !user.getTransactionPinHash().isBlank();
    }

    private String maskAadhaar(String aadhaar) {
        if (aadhaar == null || aadhaar.length() < 4) return null;
        return "••••••••" + aadhaar.substring(aadhaar.length() - 4);
    }

    private String maskPan(String pan) {
        if (pan == null || pan.length() < 4) return null;
        return "•••••" + pan.substring(pan.length() - 4);
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(user.getFullName())
                .profilePictureUrl(user.getProfilePictureUrl())
                .kycStatus(user.getKycStatus())
                .status(user.getStatus())
                .hasTransactionPin(user.getTransactionPinHash() != null && !user.getTransactionPinHash().isBlank())
                .aadhaarMasked(maskAadhaar(user.getAadhaarNumber()))
                .panMasked(maskPan(user.getPanNumber()))
                .kycDocumentUrl(user.getKycDocumentUrl())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
