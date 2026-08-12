package com.finova.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudAssessmentResponse {

    private double riskScore;
    private String riskLevel; // LOW, MEDIUM, HIGH
    private String decision;  // ALLOW, REVIEW, BLOCK
    private List<String> reasonCodes;
}
