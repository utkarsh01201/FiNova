package com.finova.service;

import com.finova.dto.KycSubmitRequest;
import com.finova.dto.SetPinRequest;
import com.finova.dto.UpdateProfileRequest;
import com.finova.dto.UserDto;
import com.finova.entity.KycStatus;
import com.finova.entity.UserStatus;

import java.util.List;

public interface UserService {

    UserDto getProfile(Long userId);

    UserDto updateProfile(Long userId, UpdateProfileRequest request);

    UserDto submitKyc(Long userId, KycSubmitRequest request);

    UserDto updateUserStatus(Long userId, UserStatus userStatus);

    List<UserDto> searchUsers(String query);

    UserDto setTransactionPin(Long userId, SetPinRequest request);

    boolean hasTransactionPin(Long userId);
}
