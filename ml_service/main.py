from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
import pandas as pd
import os
import uvicorn
from model import load_model, train_and_save_model

app = FastAPI(
    title="Finova AI Fraud Detection Microservice",
    description="Machine Learning service evaluating fintech transaction fraud risk scores using Scikit-Learn RandomForestClassifier",
    version="1.0.0"
)

# Load trained model
model = load_model()

class FraudAssessmentRequest(BaseModel):
    transactionId: Optional[int] = None
    senderId: int
    receiverId: int
    amount: float = Field(..., gt=0, description="Transaction amount in INR")
    recentTxCount: int = Field(default=0, ge=0, description="Transactions sent by sender in past 1 hour")
    amountDeviationRatio: float = Field(default=1.0, ge=0, description="Ratio of amount to sender's historical average")
    isNewRecipient: int = Field(default=0, ge=0, le=1, description="1 if first transfer to recipient, else 0")
    hourOfDay: int = Field(default=12, ge=0, le=23, description="Hour of transaction (0-23)")

class FraudAssessmentResponse(BaseModel):
    riskScore: float
    riskLevel: str  # LOW, MEDIUM, HIGH
    decision: str   # ALLOW, REVIEW, BLOCK
    reasonCodes: List[str] = []

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "Finova AI Fraud Detection Service",
        "modelLoaded": model is not None,
        "disclaimer": "Educational simulation model trained on synthetic fintech transaction data."
    }

@app.post("/api/v1/fraud/assess", response_model=FraudAssessmentResponse)
def assess_transaction_fraud(request: FraudAssessmentRequest):
    try:
        # Prepare input features
        X_input = pd.DataFrame([{
            'amount': request.amount,
            'recent_tx_count': request.recentTxCount,
            'dev_ratio': request.amountDeviationRatio,
            'is_new_recipient': request.isNewRecipient,
            'hour_of_day': request.hourOfDay
        }])

        # Predict probability of fraud (Class 1)
        probabilities = model.predict_proba(X_input)
        fraud_prob = float(probabilities[0][1])

        # Evaluate risk level & decision
        reason_codes = []
        if request.amountDeviationRatio > 4.0:
            reason_codes.append("HIGH_AMOUNT_DEVIATION")
        if request.recentTxCount > 5:
            reason_codes.append("UNUSUAL_TRANSACTION_BURST")
        if request.isNewRecipient == 1 and (request.hourOfDay < 4 or request.hourOfDay > 23):
            reason_codes.append("OFF_HOURS_NEW_RECIPIENT")
        if request.amount > 50000:
            reason_codes.append("LARGE_TRANSACTION_AMOUNT")

        if fraud_prob >= 0.70 or request.amountDeviationRatio > 8.0:
            risk_level = "HIGH"
            decision = "BLOCK"
        elif fraud_prob >= 0.35 or len(reason_codes) >= 2:
            risk_level = "MEDIUM"
            decision = "REVIEW"
        else:
            risk_level = "LOW"
            decision = "ALLOW"

        return FraudAssessmentResponse(
            riskScore=round(fraud_prob, 4),
            riskLevel=risk_level,
            decision=decision,
            reasonCodes=reason_codes
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud evaluation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
