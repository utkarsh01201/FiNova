package com.finova.service;

import com.finova.dto.FraudAssessmentResponse;
import com.finova.entity.User;

import java.math.BigDecimal;

public interface FraudDetectionClientService {

    FraudAssessmentResponse evaluateTransactionRisk(User sender, User receiver, BigDecimal amount);
}
