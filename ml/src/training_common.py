from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DATA_DIR = PROJECT_ROOT / "ml" / "data" / "raw"
ARTIFACTS_DIR = PROJECT_ROOT / "ml" / "artifacts"


def load_csv(filename: str) -> pd.DataFrame:
    path = RAW_DATA_DIR / filename
    if not path.is_file():
        raise FileNotFoundError(f"Required training data file not found: {path}")
    return pd.read_csv(path)


def perishable_inventory_path() -> Path:
    standard_path = RAW_DATA_DIR / "perishable_inventory.csv"
    copied_path = RAW_DATA_DIR / "perishable_inventory copy.csv"
    if standard_path.is_file():
        return standard_path
    if copied_path.is_file():
        return copied_path
    raise FileNotFoundError(
        "Perishable inventory data not found; expected "
        f"{standard_path.name!r} or {copied_path.name!r} in {RAW_DATA_DIR}"
    )


def load_perishable_inventory() -> pd.DataFrame:
    path = perishable_inventory_path()
    return pd.read_csv(path)


def add_calendar_features(
    frame: pd.DataFrame, dates: pd.Series
) -> pd.DataFrame:
    result = frame.copy()
    date_values = pd.to_datetime(dates, errors="raise")
    day_of_year = date_values.dt.day_of_year
    result["calendar_day_of_week"] = date_values.dt.day_of_week
    result["calendar_month"] = date_values.dt.month
    result["calendar_day_of_year_sin"] = np.sin(
        2 * np.pi * day_of_year / 365.25
    )
    result["calendar_day_of_year_cos"] = np.cos(
        2 * np.pi * day_of_year / 365.25
    )
    result["calendar_is_weekend"] = date_values.dt.day_of_week.ge(5).astype(int)
    return result


def chronological_split(
    frame: pd.DataFrame, date_column: str, test_fraction: float = 0.2
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Timestamp]:
    if not 0 < test_fraction < 1:
        raise ValueError("test_fraction must be between 0 and 1")
    if date_column not in frame:
        raise ValueError(f"Chronological split column {date_column!r} is missing")
    dates = pd.to_datetime(frame[date_column], errors="raise")
    unique_dates = pd.Index(dates.dropna().unique()).sort_values()
    split_index = int(len(unique_dates) * (1 - test_fraction))
    if split_index < 1 or split_index >= len(unique_dates):
        raise ValueError("Not enough distinct dates to create a chronological split")
    cutoff = pd.Timestamp(unique_dates[split_index])
    train = frame.loc[dates < cutoff].copy()
    test = frame.loc[dates >= cutoff].copy()
    if train.empty or test.empty:
        raise ValueError("Chronological split produced an empty train or test set")
    return train, test, cutoff


def grouped_split(
    frame: pd.DataFrame, group_column: str, random_state: int = 42
) -> tuple[pd.DataFrame, pd.DataFrame]:
    if group_column not in frame:
        raise ValueError(f"Grouped split column {group_column!r} is missing")
    if frame[group_column].isna().any():
        raise ValueError(f"Grouped split column {group_column!r} contains missing values")
    splitter = GroupShuffleSplit(
        n_splits=1, test_size=0.2, random_state=random_state
    )
    train_indices, test_indices = next(
        splitter.split(frame, groups=frame[group_column])
    )
    return frame.iloc[train_indices].copy(), frame.iloc[test_indices].copy()


def create_pipeline(
    estimator, numeric_features: list[str], categorical_features: list[str]
) -> Pipeline:
    transformers = []
    if numeric_features:
        numeric_pipeline = Pipeline(
            [("imputer", SimpleImputer(strategy="median"))]
        )
        transformers.append(("numeric", numeric_pipeline, numeric_features))
    if categorical_features:
        categorical_pipeline = Pipeline(
            [
                ("imputer", SimpleImputer(strategy="most_frequent")),
                (
                    "onehot",
                    OneHotEncoder(handle_unknown="ignore", sparse_output=True),
                ),
            ]
        )
        transformers.append(
            ("categorical", categorical_pipeline, categorical_features)
        )
    if not transformers:
        raise ValueError("At least one numeric or categorical feature is required")
    preprocessing = ColumnTransformer(
        transformers=transformers, remainder="drop"
    )
    return Pipeline([("preprocessing", preprocessing), ("model", estimator)])


def regression_metrics(
    actual: pd.Series, predicted
) -> dict[str, float]:
    actual_values = np.asarray(actual, dtype=float)
    predicted_values = np.asarray(predicted, dtype=float)
    return {
        "mae": float(mean_absolute_error(actual_values, predicted_values)),
        "rmse": float(np.sqrt(mean_squared_error(actual_values, predicted_values))),
        "r2": float(r2_score(actual_values, predicted_values)),
    }


def select_model(
    train_frame: pd.DataFrame,
    target: str,
    candidates: dict[str, Callable[[], object]],
    make_model: Callable[[object], Pipeline],
    split_validation: Callable[
        [pd.DataFrame], tuple[pd.DataFrame, pd.DataFrame]
    ],
    evaluate: Callable[[Pipeline, pd.DataFrame], dict[str, float | None]],
    selection_metric: str,
    maximize: bool,
) -> tuple[Pipeline, dict[str, object]]:
    if target not in train_frame:
        raise ValueError(f"Training target {target!r} is missing")
    if not candidates:
        raise ValueError("At least one model candidate is required")
    inner_train, validation = split_validation(train_frame)
    if inner_train.empty or validation.empty:
        raise ValueError("Validation split produced an empty train or validation set")

    validation_metrics: dict[str, dict[str, float | None]] = {}
    for name, estimator_factory in candidates.items():
        fitted = make_model(estimator_factory())
        fitted.fit(inner_train, inner_train[target])
        scores = evaluate(fitted, validation)
        if selection_metric not in scores or scores[selection_metric] is None:
            raise ValueError(
                f"Candidate {name!r} did not produce selection metric "
                f"{selection_metric!r}"
            )
        validation_metrics[name] = scores

    best_name = (
        max(
            validation_metrics,
            key=lambda name: float(validation_metrics[name][selection_metric]),
        )
        if maximize
        else min(
            validation_metrics,
            key=lambda name: float(validation_metrics[name][selection_metric]),
        )
    )
    best_model = make_model(candidates[best_name]())
    best_model.fit(train_frame, train_frame[target])
    selection: dict[str, object] = {
        "selected_model": best_name,
        "selection_metric": selection_metric,
        "maximize_selection_metric": maximize,
        "candidate_validation_metrics": validation_metrics,
    }
    return best_model, selection


def fit_final_model(
    candidates: dict[str, Callable[[], object]],
    selection: dict[str, object],
    make_model: Callable[[object], Pipeline],
    frame: pd.DataFrame,
    target: str,
) -> Pipeline:
    selected_name = selection.get("selected_model")
    if selected_name not in candidates:
        raise ValueError(f"Selected model {selected_name!r} is not a candidate")
    model = make_model(candidates[selected_name]())
    model.fit(frame, frame[target])
    return model


def save_artifact(name: str, model: Pipeline, result: dict[str, object]) -> Path:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    artifact_path = ARTIFACTS_DIR / f"{name}.joblib"
    metrics_path = ARTIFACTS_DIR / "metrics.json"
    result["artifact"] = artifact_path.name
    result["trained_at_utc"] = datetime.now(timezone.utc).isoformat()

    joblib.dump(model, artifact_path)
    if metrics_path.is_file():
        with metrics_path.open(encoding="utf-8") as metrics_file:
            metrics = json.load(metrics_file)
        if not isinstance(metrics, dict):
            raise ValueError(f"Expected a JSON object in {metrics_path}")
    else:
        metrics = {}
    metrics[name] = result
    temporary_path = metrics_path.with_suffix(".json.tmp")
    with temporary_path.open("w", encoding="utf-8", newline="\n") as metrics_file:
        json.dump(metrics, metrics_file, indent=2, allow_nan=False)
        metrics_file.write("\n")
    temporary_path.replace(metrics_path)
    return artifact_path
