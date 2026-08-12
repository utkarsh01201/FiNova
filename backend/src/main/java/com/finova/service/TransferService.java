package com.finova.service;

import com.finova.dto.SendMoneyRequest;
import com.finova.dto.TransactionDto;

public interface TransferService {

    TransactionDto sendMoney(Long senderUserId, SendMoneyRequest request);

    TransactionDto getTransactionById(Long userId, Long transactionId);
}
