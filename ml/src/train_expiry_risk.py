import pandas as pd
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from ml.src.training_common import (
    add_calendar_features,
    chronological_split,
    create_pipeline,
    fit_final_model,
    load_csv,
    save_artifact,
    select_model,
)

TARGET = "expiry_risk_label"
EXCLUDED_COLUMNS = (TARGET, "waste_units_actual_simulated", "batch_id")


def prepare_expiry_risk_data() -> tuple[pd.DataFrame, list[str], list[str]]:
    source = load_csv("inventory_batches.csv")
    required = {
        TARGET,
        "snapshot_date",
        "received_at",
        "expiry_date",
        "product_id",
        "category",
        "initial_quantity",
        "quantity_remaining",
        "days_to_expiry",
        "avg_daily_sales_7d",
        "expected_demand_before_expiry",
        "unit_price",
        "unit_cost",
        "discount_pct",
    }
    missing = required.difference(source.columns)
    if missing:
        raise ValueError(f"Expiry risk data is missing columns: {sorted(missing)}")

    frame = source.copy()
    for column in ("snapshot_date", "received_at", "expiry_date"):
        frame[column] = pd.to_datetime(frame[column], errors="raise")
    frame[TARGET] = pd.to_numeric(frame[TARGET], errors="raise").astype(int)
    if not set(frame[TARGET].unique()).issubset({0, 1}):
        raise ValueError(f"{TARGET} must contain binary 0/1 values")
    frame["product_id"] = frame["product_id"].astype(str)
    frame["category"] = frame["category"].astype(str)
    frame["days_since_received"] = (
        frame["snapshot_date"] - frame["received_at"]
    ).dt.days
    frame["days_until_expiry_from_dates"] = (
        frame["expiry_date"] - frame["snapshot_date"]
    ).dt.days
    frame = add_calendar_features(frame, frame["snapshot_date"])

    numeric_features = [
        "initial_quantity",
        "quantity_remaining",
        "days_to_expiry",
        "avg_daily_sales_7d",
        "expected_demand_before_expiry",
        "unit_price",
        "unit_cost",
        "discount_pct",
        "days_since_received",
        "days_until_expiry_from_dates",
        "calendar_day_of_week",
        "calendar_month",
        "calendar_day_of_year_sin",
        "calendar_day_of_year_cos",
        "calendar_is_weekend",
    ]
    categorical_features = ["product_id", "category"]
    frame = frame[
        ["snapshot_date", TARGET, *numeric_features, *categorical_features]
    ]
    return frame, numeric_features, categorical_features


def classification_metrics(
    fitted, data: pd.DataFrame, numeric_features: list[str], categorical_features: list[str]
) -> dict[str, float | None]:
    target_values = data[TARGET].astype(int)
    feature_data = data[numeric_features + categorical_features]
    predictions = fitted.predict(feature_data).astype(int)
    probabilities = fitted.predict_proba(feature_data)[:, 1]
    return {
        "accuracy": float(accuracy_score(target_values, predictions)),
        "balanced_accuracy": float(balanced_accuracy_score(target_values, predictions)),
        "precision": float(precision_score(target_values, predictions, zero_division=0)),
        "recall": float(recall_score(target_values, predictions, zero_division=0)),
        "f1": float(f1_score(target_values, predictions, zero_division=0)),
        "roc_auc": (
            float(roc_auc_score(target_values, probabilities))
            if target_values.nunique() == 2
            else None
        ),
    }


def train() -> dict[str, object]:
    frame, numeric_features, categorical_features = prepare_expiry_risk_data()
    train_frame, test_frame, cutoff = chronological_split(frame, "snapshot_date")
    candidates = {
        "random_forest": lambda: RandomForestClassifier(
            n_estimators=250,
            min_samples_leaf=2,
            max_features="sqrt",
            class_weight="balanced_subsample",
            n_jobs=-1,
            random_state=42,
        ),
        "extra_trees": lambda: ExtraTreesClassifier(
            n_estimators=250,
            min_samples_leaf=2,
            max_features="sqrt",
            class_weight="balanced",
            n_jobs=-1,
            random_state=42,
        ),
    }

    def make_model(estimator):
        return create_pipeline(estimator, numeric_features, categorical_features)

    def evaluate(fitted, data):
        return classification_metrics(
            fitted, data, numeric_features, categorical_features
        )

    model, selection = select_model(
        train_frame,
        TARGET,
        candidates,
        make_model,
        lambda data: chronological_split(data, "snapshot_date")[:2],
        evaluate,
        "f1",
        maximize=True,
    )
    test_metrics = evaluate(model, test_frame)
    majority_class = int(train_frame[TARGET].mode().iloc[0])
    baseline_predictions = [majority_class] * len(test_frame)
    baseline = {
        "accuracy": float(accuracy_score(test_frame[TARGET], baseline_predictions)),
        "balanced_accuracy": float(
            balanced_accuracy_score(test_frame[TARGET], baseline_predictions)
        ),
        "f1": float(
            f1_score(test_frame[TARGET], baseline_predictions, zero_division=0)
        ),
    }
    model = fit_final_model(candidates, selection, make_model, frame, TARGET)
    result: dict[str, object] = {
        "task": "expiry_risk_classification",
        "source": "inventory_batches.csv",
        "target": TARGET,
        "excluded_target_columns": list(EXCLUDED_COLUMNS),
        "split": "chronological_by_snapshot_date",
        "test_cutoff": cutoff.isoformat(),
        "train_rows": int(len(train_frame)),
        "test_rows": int(len(test_frame)),
        "final_model_fit_rows": int(len(frame)),
        "final_model_fit_includes_holdout": True,
        "holdout_metrics_use_train_only_model": True,
        "train_date_range": [
            train_frame["snapshot_date"].min().date().isoformat(),
            train_frame["snapshot_date"].max().date().isoformat(),
        ],
        "test_date_range": [
            test_frame["snapshot_date"].min().date().isoformat(),
            test_frame["snapshot_date"].max().date().isoformat(),
        ],
        "features": numeric_features + categorical_features,
        "validation_model_selection": selection,
        "holdout_metrics": test_metrics,
        "majority_class_baseline_metrics": baseline,
        "label_note": (
            "The supplied CSV also contains a simulated waste outcome; that outcome "
            "is deliberately excluded to prevent target leakage."
        ),
    }
    artifact_path = save_artifact("expiry_risk", model, result)
    result["artifact"] = artifact_path.name
    return result


if __name__ == "__main__":
    train()
