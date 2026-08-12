-- ============================================================================
-- FINOVA PAY & UPI PLATFORM - DATABASE SCHEMA
-- Target RDBMS: MySQL 8.0+
-- Database Name: finova_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `finova_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `finova_db`;

-- Drop existing tables in reverse dependency order (if any)
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `fraud_assessments`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `money_requests`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `bank_accounts`;
DROP TABLE IF EXISTS `wallets`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `users`;

-- ----------------------------------------------------------------------------
-- Table 1: ROLES
-- Description: Stores security roles (ROLE_USER, ROLE_ADMIN)
-- ----------------------------------------------------------------------------
CREATE TABLE `roles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Roles
INSERT INTO `roles` (`name`) VALUES ('ROLE_USER'), ('ROLE_ADMIN');

-- ----------------------------------------------------------------------------
-- Table 2: USERS
-- Description: Core account table for registered users and administrators
-- ----------------------------------------------------------------------------
CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone_number` VARCHAR(15) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `profile_picture_url` LONGTEXT NULL,
    `kyc_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `transaction_pin_hash` VARCHAR(255) NULL,
    `aadhaar_number` VARCHAR(20) NULL,
    `pan_number` VARCHAR(10) NULL,
    `kyc_document_url` LONGTEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_phone` (`phone_number`),
    CONSTRAINT `chk_kyc_status` CHECK (`kyc_status` IN ('PENDING', 'VERIFIED', 'REJECTED')),
    CONSTRAINT `chk_user_status` CHECK (`status` IN ('ACTIVE', 'SUSPENDED', 'BLOCKED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 3: USER_ROLES
-- Description: Many-to-many link between users and roles
-- ----------------------------------------------------------------------------
CREATE TABLE `user_roles` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    PRIMARY KEY (`user_id`, `role_id`),
    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 4: WALLETS
-- Description: Digital wallet attached 1:1 to every user
-- ----------------------------------------------------------------------------
CREATE TABLE `wallets` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `wallet_uuid` VARCHAR(36) NOT NULL UNIQUE,
    `user_id` BIGINT NOT NULL UNIQUE,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_wallet_balance` CHECK (`balance` >= 0.00),
    CONSTRAINT `chk_wallet_status` CHECK (`status` IN ('ACTIVE', 'FROZEN', 'CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 5: BANK_ACCOUNTS (UPI & Bank Integration)
-- Description: Linked bank accounts with unique UPI IDs and encrypted UPI PINs
-- ----------------------------------------------------------------------------
CREATE TABLE `bank_accounts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `bank_name` VARCHAR(100) NOT NULL,
    `account_number` VARCHAR(30) NOT NULL,
    `ifsc_code` VARCHAR(20) NOT NULL,
    `account_holder_name` VARCHAR(100) NOT NULL,
    `upi_id` VARCHAR(100) NOT NULL UNIQUE,
    `upi_pin_hash` VARCHAR(255) NOT NULL,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 25000.00,
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_bank_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_bank_user` (`user_id`),
    INDEX `idx_bank_upi_id` (`upi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 6: TRANSACTIONS
-- Description: Transaction ledger for money movement, UPI transfers, deposits
-- ----------------------------------------------------------------------------
CREATE TABLE `transactions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `transaction_reference` VARCHAR(36) NOT NULL UNIQUE,
    `sender_wallet_id` BIGINT NULL,
    `receiver_wallet_id` BIGINT NULL,
    `sender_bank_account_id` BIGINT NULL,
    `receiver_bank_account_id` BIGINT NULL,
    `payment_method` VARCHAR(20) NOT NULL DEFAULT 'WALLET',
    `upi_id` VARCHAR(100) NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `description` VARCHAR(255) NULL,
    `fraud_risk_score` DOUBLE NULL,
    `fraud_risk_level` VARCHAR(20) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tx_sender_wallet` FOREIGN KEY (`sender_wallet_id`) REFERENCES `wallets` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_tx_receiver_wallet` FOREIGN KEY (`receiver_wallet_id`) REFERENCES `wallets` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_tx_sender_bank` FOREIGN KEY (`sender_bank_account_id`) REFERENCES `bank_accounts` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_tx_receiver_bank` FOREIGN KEY (`receiver_bank_account_id`) REFERENCES `bank_accounts` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_tx_amount` CHECK (`amount` > 0.00),
    CONSTRAINT `chk_tx_type` CHECK (`type` IN ('ADD_MONEY', 'SEND_MONEY', 'RECEIVE_MONEY', 'REQUEST_MONEY', 'REFUND', 'BANK_TRANSFER', 'UPI_PAYMENT', 'WITHDRAW', 'GAME_WIN', 'GAME_LOSS')),
    CONSTRAINT `chk_tx_status` CHECK (`status` IN ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'BLOCKED')),
    INDEX `idx_tx_reference` (`transaction_reference`),
    INDEX `idx_tx_sender` (`sender_wallet_id`),
    INDEX `idx_tx_receiver` (`receiver_wallet_id`),
    INDEX `idx_tx_created` (`created_at`),
    INDEX `idx_tx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 7: MONEY_REQUESTS
-- Description: Peer-to-peer request money workflow
-- ----------------------------------------------------------------------------
CREATE TABLE `money_requests` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `request_reference` VARCHAR(36) NOT NULL UNIQUE,
    `requester_id` BIGINT NOT NULL,
    `payer_id` BIGINT NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `description` VARCHAR(255) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `transaction_id` BIGINT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_req_requester` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_req_payer` FOREIGN KEY (`payer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_req_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE SET NULL,
    CONSTRAINT `chk_req_amount` CHECK (`amount` > 0.00),
    CONSTRAINT `chk_req_status` CHECK (`status` IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
    INDEX `idx_req_requester` (`requester_id`),
    INDEX `idx_req_payer` (`payer_id`),
    INDEX `idx_req_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 8: NOTIFICATIONS
-- Description: In-app alerts and notifications for users
-- ----------------------------------------------------------------------------
CREATE TABLE `notifications` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_notif_type` CHECK (`type` IN ('TRANSACTION', 'MONEY_REQUEST', 'SYSTEM', 'FRAUD_ALERT')),
    INDEX `idx_notif_user_read` (`user_id`, `is_read`),
    INDEX `idx_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 9: FRAUD_ASSESSMENTS
-- Description: Fraud scores and decision metadata returned by Python ML service
-- ----------------------------------------------------------------------------
CREATE TABLE `fraud_assessments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `transaction_id` BIGINT NOT NULL UNIQUE,
    `risk_score` DOUBLE NOT NULL,
    `risk_level` VARCHAR(20) NOT NULL,
    `decision` VARCHAR(20) NOT NULL,
    `reason_codes` TEXT NULL,
    `evaluated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_fraud_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_fraud_level` CHECK (`risk_level` IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT `chk_fraud_decision` CHECK (`decision` IN ('ALLOW', 'REVIEW', 'BLOCK'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 10: AUDIT_LOGS
-- Description: Audit trail for administrative and sensitive security events
-- ----------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_name` VARCHAR(50) NOT NULL,
    `entity_id` BIGINT NULL,
    `ip_address` VARCHAR(45) NULL,
    `details` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_audit_user` (`user_id`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
