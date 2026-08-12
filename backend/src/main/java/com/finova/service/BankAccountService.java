package com.finova.service;

import com.finova.dto.*;

import java.util.List;

public interface BankAccountService {

    BankAccountDto linkBankAccount(Long userId, LinkBankRequest request);

    List<BankAccountDto> getUserBankAccounts(Long userId);

    BankAccountDto checkBalanceWithUpiPin(Long userId, CheckBalanceRequest request);

    BankAccountDto setPrimaryBankAccount(Long userId, Long bankAccountId);

    TransactionDto sendMoneyViaUpi(Long userId, UpiSendMoneyRequest request);
}
