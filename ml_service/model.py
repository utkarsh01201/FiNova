import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

MODEL_FILE = os.path.join(os.path.dirname(__file__), "fraud_model.joblib")

def train_and_save_model():
    np.random.seed(42)
    n_samples = 5000

    # Feature generation:
    # 1. amount
    # 2. senderRecentTxCount (burst rate)
    # 3. amountDeviationRatio (amount / avg_amount)
    # 4. isNewRecipient (0 or 1)
    # 5. hourOfDay (0-23)

    amount = np.random.exponential(scale=1500, size=n_samples) + 10
    recent_tx_count = np.random.poisson(lam=2, size=n_samples)
    dev_ratio = np.random.lognormal(mean=0.0, sigma=0.8, size=n_samples)
    is_new_recipient = np.random.binomial(n=1, p=0.3, size=n_samples)
    hour_of_day = np.random.randint(0, 24, size=n_samples)

    # Synthetic label rule:
    # High deviation (> 5.0) or high burst count (> 8) or late night new recipient -> Fraud (1)
    fraud = np.zeros(n_samples, dtype=int)
    for i in range(n_samples):
        score = 0
        if dev_ratio[i] > 4.5:
            score += 0.4
        if recent_tx_count[i] > 6:
            score += 0.35
        if is_new_recipient[i] == 1 and (hour_of_day[i] < 4 or hour_of_day[i] > 23):
            score += 0.3
        if amount[i] > 50000:
            score += 0.25

        if score >= 0.5:
            fraud[i] = 1

    df = pd.DataFrame({
        'amount': amount,
        'recent_tx_count': recent_tx_count,
        'dev_ratio': dev_ratio,
        'is_new_recipient': is_new_recipient,
        'hour_of_day': hour_of_day,
        'fraud': fraud
    })

    X = df[['amount', 'recent_tx_count', 'dev_ratio', 'is_new_recipient', 'hour_of_day']]
    y = df['fraud']

    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    clf.fit(X, y)

    joblib.dump(clf, MODEL_FILE)
    print(f"Model trained on {n_samples} synthetic transaction samples. Saved to {MODEL_FILE}")
    return clf

def load_model():
    if not os.path.exists(MODEL_FILE):
        return train_and_save_model()
    return joblib.load(MODEL_FILE)

if __name__ == "__main__":
    train_and_save_model()
