package com.finova.service.impl;

import com.finova.dto.FraudAssessmentRequest;
import com.finova.dto.FraudAssessmentResponse;
import com.finova.entity.User;
import com.finova.repository.TransactionRepository;
import com.finova.service.FraudDetectionClientService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Slf4j
@Service
public class FraudDetectionClientServiceImpl implements FraudDetectionClientService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Value("${finova.fraud-service.url:http://localhost:8000/api/v1/fraud/assess}")
    private String fraudServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public FraudAssessmentResponse evaluateTransactionRisk(User sender, User receiver, BigDecimal amount) {
        try {
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            long recentCount = transactionRepository.countRecentTransactionsByUser(sender.getId(), oneHourAgo);
            BigDecimal avgAmount = transactionRepository.calculateAverageTransactionAmountByUser(sender.getId());

            double devRatio = 1.0;
            if (avgAmount != null && avgAmount.compareTo(BigDecimal.ZERO) > 0) {
                devRatio = amount.divide(avgAmount, 2, RoundingMode.HALF_UP).doubleValue();
            }

            int hour = LocalDateTime.now().getHour();

            FraudAssessmentRequest request = FraudAssessmentRequest.builder()
                    .senderId(sender.getId())
                    .receiverId(receiver.getId())
                    .amount(amount)
                    .recentTxCount((int) recentCount)
                    .amountDeviationRatio(devRatio)
                    .isNewRecipient(0)
                    .hourOfDay(hour)
                    .build();

            ResponseEntity<FraudAssessmentResponse> response = restTemplate.postForEntity(
                    fraudServiceUrl, request, FraudAssessmentResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

        } catch (Exception e) {
            log.warn("FastAPI ML Fraud service call failed or unavailable ({}), applying fallback heuristics", e.getMessage());
        }

        // Fallback Heuristics
        if (amount.compareTo(new BigDecimal("100000.00")) > 0) {
            return FraudAssessmentResponse.builder()
                    .riskScore(0.85)
                    .riskLevel("HIGH")
                    .decision("BLOCK")
                    .build();
        }

        return FraudAssessmentResponse.builder()
                .riskScore(0.05)
                .riskLevel("LOW")
                .decision("ALLOW")
                .build();
    }
}
