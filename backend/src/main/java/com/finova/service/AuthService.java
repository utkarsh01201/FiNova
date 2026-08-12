package com.finova.service;

import com.finova.dto.*;

public interface AuthService {

    JwtAuthResponse register(RegisterRequest registerRequest);

    JwtAuthResponse login(LoginRequest loginRequest);

    UserDto getCurrentUser(Long userId);

    void changePassword(Long userId, ChangePasswordRequest changePasswordRequest);
}
