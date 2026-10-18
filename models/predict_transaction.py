
import os
import joblib
import pandas as pd


MODEL_PATH = "models/transaction_model.joblib"


def load_model():
    """Load the trained transaction model and metadata."""

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Train the model first."
        )

    bundle = joblib.load(MODEL_PATH)

    if not isinstance(bundle, dict) or "model" not in bundle:
        raise ValueError(
            "Unexpected model format. "
            "Please retrain using train_transaction.py."
        )

    return bundle


def predict_transaction(
    step,
    transaction_type,
    amount,
    oldbalance_org,
    newbalance_orig,
    oldbalance_dest,
    newbalance_dest
):
    """Return the predicted fraud probability and risk level."""

    bundle = load_model()
    model = bundle["model"]

    transaction = pd.DataFrame([{
        "step": step,
        "type": transaction_type,
        "amount": amount,
        "oldbalanceOrg": oldbalance_org,
        "newbalanceOrig": newbalance_orig,
        "oldbalanceDest": oldbalance_dest,
        "newbalanceDest": newbalance_dest
    }])

    # Apply the same transformation used during training.
    transaction["amount"] = __import__("numpy").log1p(
        transaction["amount"]
    )

    probability = float(
        model.predict_proba(transaction)[0][1]
    )

    threshold = bundle.get("selected_threshold", 0.5)

    return {
        "fraud_probability": round(probability, 6),
        "experimental_threshold": round(float(threshold), 6),
        "above_experimental_threshold": probability >= threshold
    }


if __name__ == "__main__":
    result = predict_transaction(
        step=10,
        transaction_type="TRANSFER",
        amount=50000,
        oldbalance_org=60000,
        newbalance_orig=10000,
        oldbalance_dest=20000,
        newbalance_dest=70000
    )

    print("Transaction prediction:")
    for key, value in result.items():
        print(f"{key}: {value}")
