# Finova — System Architecture Blueprint

## 1. Overview
**Finova** is a production-inspired, educational digital wallet and payment platform. It enables simulated peer-to-peer (P2P) transfers, QR code payments, virtual wallet management, money requests, admin management, and AI-powered transaction fraud risk scoring.

---

## 2. High-Level System Architecture

```mermaid
graph TB
    subgraph Client Layer
        SPA["React SPA Frontend (Port 3000)<br/>- React Router, Tailwind CSS, Axios, Context API"]
    end

    subgraph API & Security Layer
        Gateway["Spring Security & JWT Filter<br/>- Authentication & RBAC Authorization"]
    end

    subgraph Service Layer (Spring Boot 3.x - Java 17)
        AuthSvc["Auth Service"]
        UserSvc["User & Profile Service"]
        WalletSvc["Wallet & Transaction Engine (@Transactional)"]
        RequestSvc["Money Request Service"]
        NotifSvc["Notification Service"]
        AdminSvc["Admin & Analytics Service"]
        FraudClient["Fraud Detection Client (RestTemplate / WebClient)"]
    end

    subgraph Data & Storage Layer
        MySQL[("MySQL 8.0 Database (finova_db)<br/>- Transactions, Accounts, Wallets")]
        Redis[("Redis Cache<br/>- Session Token Blacklist & Rate Limiting")]
    end

    subgraph AI Microservice
        FastAPI["Python FastAPI Service (Port 8000)<br/>- Scikit-Learn Fraud Model"]
    end

    SPA -->|HTTPS / REST API + Bearer JWT| Gateway
    Gateway --> AuthSvc
    Gateway --> UserSvc
    Gateway --> WalletSvc
    Gateway --> RequestSvc
    Gateway --> NotifSvc
    Gateway --> AdminSvc

    WalletSvc -->|Pessimistic Locking / DB Transaction| MySQL
    WalletSvc -->|Evaluates Risk| FraudClient
    FraudClient -->|POST /api/v1/fraud/assess| FastAPI
    AuthSvc -->|Token Blacklist| Redis
    UserSvc --> MySQL
    RequestSvc --> MySQL
    NotifSvc --> MySQL
    AdminSvc --> MySQL
```

---

## 3. Key Architectural Principles & Controls

### A. Financial Transaction Safety (`@Transactional` & Atomicity)
For P2P virtual money transfers:
1. **Pessimistic Lock (`SELECT ... FOR UPDATE`)**: Sender & Receiver wallet records locked during transaction execution to eliminate concurrency race conditions & double-spending.
2. **Atomic Steps**:
   - Verify Sender Wallet active & Balance $\ge$ Amount.
   - Synchronous HTTP call to FastAPI Fraud Detection Service.
   - If `riskLevel == HIGH` / `decision == BLOCK`, mark transaction as `BLOCKED`, notify user & throw `FraudRiskException` (Rollback).
   - Debit Sender Wallet balance (`DECIMAL(15,2)`).
   - Credit Receiver Wallet balance (`DECIMAL(15,2)`).
   - Record Immutable Ledger Entry in `transactions` (`status = SUCCESS`).
   - Trigger In-App Notification.
   - Commit DB Transaction.

### B. Security Architecture
- **Stateless JWT**: Standard Authorization header format `Bearer <token>`.
- **BCrypt Encryption**: Work factor 12 for password storage.
- **Role-Based Access Control (RBAC)**: `ROLE_USER` vs `ROLE_ADMIN`.
- **Sensitive Data Masking**: DTOs omit passwords, internal keys, or direct entity models.

### C. Database ER Relationships
- `User` (1) ── (1) `Wallet`
- `User` (M) ── (M) `Role` (via `user_roles`)
- `Wallet` (1) ── (M) `Transaction` (Sender / Receiver)
- `User` (1) ── (M) `MoneyRequest` (Requester / Payer)
- `User` (1) ── (M) `Notification`
- `Transaction` (1) ── (0..1) `FraudAssessment`
