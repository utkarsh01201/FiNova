package com.finova.service;

import com.finova.dto.AdminAnalyticsDto;
import com.finova.dto.PageResponse;
import com.finova.dto.TransactionDto;
import com.finova.dto.UserDto;
import com.finova.entity.UserStatus;

public interface AdminService {

    AdminAnalyticsDto getSystemAnalytics();

    PageResponse<UserDto> getAllUsers(int page, int size);

    UserDto updateUserAccountStatus(Long userId, UserStatus status);

    PageResponse<TransactionDto> getAllSystemTransactions(int page, int size);
}
