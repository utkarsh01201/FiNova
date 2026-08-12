package com.finova.service;

import com.finova.dto.AddMoneyRequest;
import com.finova.dto.TransactionDto;
import com.finova.dto.WalletDto;
import com.finova.dto.WithdrawToBankRequest;
import com.finova.entity.User;
import com.finova.entity.Wallet;

public interface WalletService {

    Wallet createWalletForUser(User user);

    WalletDto getWalletByUserId(Long userId);

    TransactionDto addMoney(Long userId, AddMoneyRequest addMoneyRequest);

    TransactionDto withdrawToBank(Long userId, WithdrawToBankRequest request);
}

