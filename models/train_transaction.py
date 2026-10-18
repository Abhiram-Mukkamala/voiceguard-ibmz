
import os
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    precision_score,
    recall_score,
    confusion_matrix,
    classification_report,
    precision_recall_curve
)

# File paths
DATASET_PATH = "data/transactions.csv"
MODEL_PATH = "models/transaction_model.joblib"

# Features used by the model
numeric_features = [
    "step",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest"
]

categorical_features = ["type"]

required_columns = (
    numeric_features
    + categorical_features
    + ["isFraud"]
)


def main():
    # Check that the dataset exists
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_PATH}"
        )

    print("Loading dataset...")

    df = pd.read_csv(DATASET_PATH)

    # Check required columns
    missing_columns = [
        column for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing columns in dataset: {missing_columns}"
        )

    # Keep only required columns and remove missing values
    df = df[required_columns].dropna().copy()

    # Convert numerical features to numeric values
    for column in numeric_features + ["isFraud"]:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

    df = df.dropna().copy()

    # Validate target values
    df = df[df["isFraud"].isin([0, 1])].copy()
    df["isFraud"] = df["isFraud"].astype(int)

    # Remove invalid negative monetary amounts
    df = df[df["amount"] >= 0].copy()

    print("\nDataset shape:", df.shape)

    print("\nFraud distribution:")
    print(df["isFraud"].value_counts())

    # Separate features and target
    X = df[numeric_features + categorical_features].copy()
    y = df["isFraud"]

    # Log-transform amount to reduce its skew
    X["amount"] = np.log1p(X["amount"])

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    # Preprocess numerical and categorical features
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                StandardScaler(),
                numeric_features
            ),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                categorical_features
            )
        ]
    )

    # Create the model pipeline
    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                LogisticRegression(
                    class_weight="balanced",
                    max_iter=300,
                    random_state=42
                )
            )
        ]
    )

    # Train the model
    print("\nTraining model...")

    model.fit(X_train, y_train)

    # Get fraud probabilities
    probabilities = model.predict_proba(X_test)[:, 1]

    # Evaluate ranking quality
    avg_precision = average_precision_score(
        y_test,
        probabilities
    )

    print("\nAverage precision:", round(avg_precision, 4))

    # Evaluate at the default threshold
    default_threshold = 0.5
    default_predictions = (
        probabilities >= default_threshold
    ).astype(int)

    print("\nResults at threshold 0.5:")

    print(
        "Precision:",
        round(
            precision_score(
                y_test,
                default_predictions,
                zero_division=0
            ),
            4
        )
    )

    print(
        "Recall:",
        round(
            recall_score(
                y_test,
                default_predictions,
                zero_division=0
            ),
            4
        )
    )

    print("\nConfusion matrix at threshold 0.5:")
    print(confusion_matrix(y_test, default_predictions))

    print("\nClassification report at threshold 0.5:")
    print(
        classification_report(
            y_test,
            default_predictions,
            zero_division=0
        )
    )

    # Find a threshold achieving at least 5% precision,
    # while maximizing recall among thresholds that qualify.
    precision_values, recall_values, thresholds = (
        precision_recall_curve(y_test, probabilities)
    )

    minimum_precision = 0.05

    valid_indices = np.where(
        precision_values[:-1] >= minimum_precision
    )[0]

    selected_threshold = default_threshold

    if len(valid_indices) > 0:
        best_index = valid_indices[
            np.argmax(recall_values[valid_indices])
        ]

        selected_threshold = float(thresholds[best_index])

        threshold_predictions = (
            probabilities >= selected_threshold
        ).astype(int)

        print("\nThreshold analysis")
        print("Selected threshold:", round(selected_threshold, 6))
        print(
            "Precision:",
            round(precision_values[best_index], 4)
        )
        print(
            "Recall:",
            round(recall_values[best_index], 4)
        )

        print("\nConfusion matrix at selected threshold:")
        print(confusion_matrix(y_test, threshold_predictions))
    else:
        print(
            "\nNo threshold achieved the required "
            "precision of 5%."
        )

    # Create output directory
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    # Save the trained model and metadata together
    model_bundle = {
        "model": model,
        "features": numeric_features + categorical_features,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "selected_threshold": selected_threshold,
        "default_threshold": default_threshold,
        "minimum_precision_target": minimum_precision
    }

    joblib.dump(model_bundle, MODEL_PATH)

    print("\nModel saved to", MODEL_PATH)


if __name__ == "__main__":
    main()
