package com.finova.service.impl;

import com.finova.dto.*;
import com.finova.entity.MoneyRequest;
import com.finova.entity.RequestStatus;
import com.finova.entity.User;

import com.finova.exception.BadRequestException;
import com.finova.exception.ResourceNotFoundException;
import com.finova.repository.MoneyRequestRepository;
import com.finova.repository.UserRepository;
import com.finova.service.MoneyRequestService;
import com.finova.service.TransferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MoneyRequestServiceImpl implements MoneyRequestService {

    @Autowired
    private MoneyRequestRepository moneyRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransferService transferService;

    @Override
    @Transactional
    public MoneyRequestDto createRequest(Long requesterUserId, CreateMoneyRequest request) {
        User requester = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", requesterUserId));

        String payerIdentifier = request.getPayerIdentifier().trim();
        User payer = userRepository.findByUsernameOrEmailOrPhoneNumber(
                payerIdentifier, payerIdentifier, payerIdentifier)
                .orElseThrow(() -> new ResourceNotFoundException("Payer not found with identifier: " + payerIdentifier));

        if (requester.getId().equals(payer.getId())) {
            throw new BadRequestException("You cannot request virtual money from yourself");
        }

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Invalid request amount");
        }

        String desc = request.getDescription() != null && !request.getDescription().isBlank() ?
                request.getDescription() : "Money request from " + requester.getFullName();

        MoneyRequest moneyRequest = MoneyRequest.builder()
                .requestReference(UUID.randomUUID().toString())
                .requester(requester)
                .payer(payer)
                .amount(amount)
                .description(desc)
                .status(RequestStatus.PENDING)
                .build();

        MoneyRequest saved = moneyRequestRepository.save(moneyRequest);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public TransactionDto acceptRequest(Long payerUserId, Long requestId) {
        MoneyRequest moneyRequest = moneyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("MoneyRequest", "id", requestId));

        if (!moneyRequest.getPayer().getId().equals(payerUserId)) {
            throw new BadRequestException("You are not authorized to accept this money request");
        }

        if (moneyRequest.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Money request is no longer PENDING (Current status: " + moneyRequest.getStatus() + ")");
        }

        // Execute P2P money transfer from payer to requester
        SendMoneyRequest sendMoneyRequest = new SendMoneyRequest();
        sendMoneyRequest.setRecipientIdentifier(moneyRequest.getRequester().getUsername());
        sendMoneyRequest.setAmount(moneyRequest.getAmount());
        sendMoneyRequest.setDescription("Accepted money request: " + moneyRequest.getDescription());

        TransactionDto transactionDto = transferService.sendMoney(payerUserId, sendMoneyRequest);

        // Update request status
        moneyRequest.setStatus(RequestStatus.ACCEPTED);
        moneyRequestRepository.save(moneyRequest);

        return transactionDto;
    }

    @Override
    @Transactional
    public MoneyRequestDto rejectRequest(Long payerUserId, Long requestId) {
        MoneyRequest moneyRequest = moneyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("MoneyRequest", "id", requestId));

        if (!moneyRequest.getPayer().getId().equals(payerUserId)) {
            throw new BadRequestException("You are not authorized to reject this money request");
        }

        if (moneyRequest.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Money request is no longer PENDING (Current status: " + moneyRequest.getStatus() + ")");
        }

        moneyRequest.setStatus(RequestStatus.REJECTED);
        MoneyRequest updated = moneyRequestRepository.save(moneyRequest);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public MoneyRequestDto cancelRequest(Long requesterUserId, Long requestId) {
        MoneyRequest moneyRequest = moneyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("MoneyRequest", "id", requestId));

        if (!moneyRequest.getRequester().getId().equals(requesterUserId)) {
            throw new BadRequestException("You are not authorized to cancel this money request");
        }

        if (moneyRequest.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Money request is no longer PENDING (Current status: " + moneyRequest.getStatus() + ")");
        }

        moneyRequest.setStatus(RequestStatus.CANCELLED);
        MoneyRequest updated = moneyRequestRepository.save(moneyRequest);
        return mapToDto(updated);
    }

    @Override
    public PageResponse<MoneyRequestDto> getUserRequests(Long userId, String type, RequestStatus status, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Pageable pageable = PageRequest.of(page, size);
        Page<MoneyRequest> requestsPage;

        if ("incoming".equalsIgnoreCase(type)) {
            // Requests sent to user (user is payer)
            if (status != null) {
                requestsPage = moneyRequestRepository.findByPayerAndStatusOrderByCreatedAtDesc(user, status, pageable);
            } else {
                requestsPage = moneyRequestRepository.findByPayerOrderByCreatedAtDesc(user, pageable);
            }
        } else if ("outgoing".equalsIgnoreCase(type)) {
            // Requests initiated by user (user is requester)
            requestsPage = moneyRequestRepository.findByRequesterOrderByCreatedAtDesc(user, pageable);
        } else {
            requestsPage = moneyRequestRepository.findAllUserRequests(userId, status, pageable);
        }

        List<MoneyRequestDto> content = requestsPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PageResponse.<MoneyRequestDto>builder()
                .content(content)
                .pageNo(requestsPage.getNumber())
                .pageSize(requestsPage.getSize())
                .totalElements(requestsPage.getTotalElements())
                .totalPages(requestsPage.getTotalPages())
                .last(requestsPage.isLast())
                .build();
    }

    private MoneyRequestDto mapToDto(MoneyRequest request) {
        return MoneyRequestDto.builder()
                .id(request.getId())
                .requestReference(request.getRequestReference())
                .requesterId(request.getRequester().getId())
                .requesterUsername(request.getRequester().getUsername())
                .requesterFullName(request.getRequester().getFullName())
                .payerId(request.getPayer().getId())
                .payerUsername(request.getPayer().getUsername())
                .payerFullName(request.getPayer().getFullName())
                .amount(request.getAmount())
                .description(request.getDescription())
                .status(request.getStatus())
                .transactionId(request.getTransaction() != null ? request.getTransaction().getId() : null)
                .transactionReference(request.getTransaction() != null ? request.getTransaction().getTransactionReference() : null)
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
