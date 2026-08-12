package com.finova.service;

import com.finova.dto.CreateMoneyRequest;
import com.finova.dto.MoneyRequestDto;
import com.finova.dto.PageResponse;
import com.finova.dto.TransactionDto;
import com.finova.entity.RequestStatus;

public interface MoneyRequestService {

    MoneyRequestDto createRequest(Long requesterUserId, CreateMoneyRequest request);

    TransactionDto acceptRequest(Long payerUserId, Long requestId);

    MoneyRequestDto rejectRequest(Long payerUserId, Long requestId);

    MoneyRequestDto cancelRequest(Long requesterUserId, Long requestId);

    PageResponse<MoneyRequestDto> getUserRequests(Long userId, String type, RequestStatus status, int page, int size);
}
