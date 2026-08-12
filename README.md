# Finova — Full-Stack Fintech Digital Wallet Platform

Finova is a college/resume-level fintech digital wallet and payment platform inspired by modern payment applications. It features simulated digital wallet management, peer-to-peer (P2P) transfers with strict financial transaction safety (`@Transactional` and Pessimistic Locking), QR code payments, money requests, real-time in-app notifications, formal digital receipts, admin management, and an AI-driven transaction fraud detection microservice built with Python FastAPI and Scikit-Learn.

> **Disclaimer**: Finova is an educational simulation platform. All wallet balances, top-ups, transfers, and accounts use virtual demo currency. No real money, bank accounts, or real UPI networks are connected.

---

## 1. Technology Stack

### Frontend
- **Framework**: React.js 18
- **Styling**: Vanilla Tailwind CSS + Glassmorphism & Custom Themes
- **Routing**: React Router v6
- **HTTP Client**: Axios with Bearer JWT Interceptor
- **Icons**: Lucide React Icons

### Backend
- **Language & Runtime**: Java 17 LTS
- **Framework**: Spring Boot 3.2.5 (Spring Web, Spring Data JPA, Spring Security)
- **Security**: JWT (HMAC-SHA256), BCrypt Password Hashing
- **Build Tool**: Maven Wrapper (`mvnw.cmd`)

### Database & Data Layer
- **RDBMS**: MySQL 8.0+ (`finova_db`)
- **Caching / Session Support**: Redis

### AI / ML Microservice
- **Language & Framework**: Python 3.11, FastAPI, Uvicorn
- **ML Framework**: Scikit-Learn (`RandomForestClassifier`), Pandas, NumPy

---

## 2. High-Level Architecture & Concurrency Safety

```text
React SPA Frontend (Port 3000)
       │
       ▼ (REST API + JWT Bearer Header)
Spring Boot Backend (Port 8080)
       ├──► MySQL 8.0 Database (finova_db) — [@Transactional + Pessimistic Lock FOR UPDATE]
       ├──► Redis Cache (Port 6379)
       └──► Python FastAPI AI Microservice (Port 8000) — [Scikit-Learn ML Model]
```

### Concurrency & Financial Transaction Control
1. **Double-Spend Prevention**: P2P money transfers execute SQL `SELECT ... FOR UPDATE` via `WalletRepository.findByUserIdForUpdate()` to lock sender and receiver wallets during transfer execution.
2. **Atomicity**: Wallet debit (`sender.balance = sender.balance - amount`), wallet credit (`receiver.balance = receiver.balance + amount`), and ledger creation behave as an atomic unit. If any step fails or fraud risk score triggers a `BLOCK`, the transaction automatically rolls back (`@Transactional`), ensuring the sender never loses virtual money.

---

## 3. Database Schema

The normalized `finova_db` MySQL database contains 9 entities:
1. `roles`: Security roles (`ROLE_USER`, `ROLE_ADMIN`).
2. `users`: User identity, KYC status (`PENDING`, `VERIFIED`), and status (`ACTIVE`, `SUSPENDED`, `BLOCKED`).
3. `user_roles`: Many-to-many security role mappings.
4. `wallets`: Virtual wallet linked 1:1 to every user. Balances use `DECIMAL(15,2)` for financial accuracy.
5. `transactions`: Immutable transaction ledger (`ADD_MONEY`, `SEND_MONEY`, `REQUEST_MONEY`, `REFUND`).
6. `money_requests`: P2P request money workflow (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`).
7. `notifications`: User in-app notifications and unread badges (`TRANSACTION`, `MONEY_REQUEST`, `SYSTEM`, `FRAUD_ALERT`).
8. `fraud_assessments`: ML evaluation risk scores (`LOW`, `MEDIUM`, `HIGH`) and decision history (`ALLOW`, `REVIEW`, `BLOCK`).
9. `audit_logs`: Administrative actions and security audit logging.

---

## 4. Main Application Features

- **Authentication**: JWT registration, login, profile retrieval (`/api/auth/me`), password updates with BCrypt encoding.
- **Auto-Provisioned Virtual Wallet**: Every registered user automatically receives a virtual wallet with an initial promo balance of **₹1,000.00**.
- **Wallet Top-Up**: Add demo money with preset buttons (₹500, ₹1000, ₹2000) or custom amounts.
- **P2P Money Transfers**: Instant money transfers to any registered user by username, email, or phone number with real-time balance validation.
- **Money Requests**: Request money from contacts, accept requests with one-click payment execution, reject, or cancel.
- **QR Code Payments**: Generate `finova://pay?userId=...` payment URIs and scan QR payloads to resolve recipients.
- **Digital Receipts**: Printable/downloadable receipts with reference UUIDs, timestamp, and party details.
- **AI Fraud Detection**: Spring Boot communicates with the Python FastAPI microservice to assess transaction risk scores based on amount deviation, burst rates, and off-hours behavior. High-risk transactions are blocked automatically.
- **Admin Management Console**: System metrics overview, active user directory, and account activation/suspension toggles.

---

## 5. Local Setup Instructions

### Prerequisites
- Java 17 LTS
- MySQL Server 8.0+
- Node.js 18+ & npm
- Python 3.10+ (for ML service)

### Step 1: Initialize Database
Run `docs/schema.sql` in your MySQL Server:
```sql
SOURCE docs/schema.sql;
```

### Step 2: Run Spring Boot Backend
Navigate to `backend/`:
```bash
cd backend
.\mvnw.cmd spring-boot:run
```
Backend will start on `http://localhost:8080`.

### Step 3: Run Python AI Fraud Detection Service
Navigate to `ml_service/`:
```bash
cd ml_service
pip install -r requirements.txt
python main.py
```
ML Microservice will start on `http://localhost:8000`.

### Step 4: Run React Frontend
Navigate to `frontend/`:
```bash
cd frontend
npm.cmd install
npm.cmd run dev
```
Frontend SPA will launch on `http://localhost:3000`.

---

## 6. Docker Compose Deployment

Run all services (MySQL, Spring Boot, React Frontend, Python FastAPI ML Microservice) using Docker Compose:
```bash
docker-compose up --build
```

---

## 7. Postman API Collection

A Postman API collection is available in [docs/postman_collection.json](file:///c:/Users/Utkarsh%20vatshayan/Desktop/USB/Fintech/docs/postman_collection.json).
Import the collection into Postman to test all authentication, wallet, transfer, request, and notification APIs directly.
