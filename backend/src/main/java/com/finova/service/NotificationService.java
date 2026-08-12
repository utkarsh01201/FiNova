package com.finova.service;

import com.finova.dto.NotificationDto;
import com.finova.dto.PageResponse;
import com.finova.entity.NotificationType;
import com.finova.entity.User;

public interface NotificationService {

    void sendNotification(User user, String title, String message, NotificationType type);

    PageResponse<NotificationDto> getUserNotifications(Long userId, int page, int size);

    long getUnreadCount(Long userId);

    NotificationDto markAsRead(Long userId, Long notificationId);

    void markAllAsRead(Long userId);
}
