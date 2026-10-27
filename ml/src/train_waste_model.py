import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor

from ml.src.training_common import (
    add_calendar_features,
    chronological_split,
    create_pipeline,
    fit_final_model,
    load_perishable_inventory,
    perishable_inventory_path,
    regression_metrics,
    save_artifact,
    select_model,
)

TARGET = "target_waste_units"


def prepare_food_waste_data() -> tuple[pd.DataFrame, list[str], list[str]]:
    history = load_perishable_inventory()
    required = {
        "date",
        "product_id",
        "category",
        "opening_stock",
        "units_received",
        "units_sold",
        "unit_price",
        "discount_pct",
        "days_to_expiry",
        "temperature_c",
        "waste_units",
        "stockout_flag",
    }
    missing = required.difference(history.columns)
    if missing:
        raise ValueError(f"Food waste data is missing columns: {sorted(missing)}")

    history["date"] = pd.to_datetime(history["date"], errors="raise")
    history = history.sort_values(["product_id", "date"]).reset_index(drop=True)
    for column in (
        "opening_stock",
        "units_received",
        "units_sold",
        "unit_price",
        "discount_pct",
        "days_to_expiry",
        "temperature_c",
        "waste_units",
        "stockout_flag",
    ):
        history[column] = pd.to_numeric(history[column], errors="raise")

    grouped = history.groupby("product_id", sort=False)
    next_date = grouped["date"].shift(-1)
    frame = history[
        [
            "product_id",
            "category",
            "opening_stock",
            "units_received",
            "units_sold",
            "unit_price",
            "discount_pct",
            "days_to_expiry",
            "temperature_c",
            "stockout_flag",
        ]
    ].copy()
    frame["as_of_date"] = history["date"]
    frame["target_date"] = next_date
    frame[TARGET] = grouped["waste_units"].shift(-1)
    frame["estimated_closing_stock"] = (
        history["opening_stock"] + history["units_received"] - history["units_sold"]
    )
    frame["days_to_expiry_next_day"] = history["days_to_expiry"] - 1
    frame = add_calendar_features(frame, frame["target_date"])
    frame = frame.loc[
        frame["target_date"].eq(frame["as_of_date"] + pd.Timedelta(days=1))
    ].dropna(subset=[TARGET, "target_date"])
    frame["product_id"] = frame["product_id"].astype(str)
    frame["category"] = frame["category"].astype(str)

    numeric_features = [
        "opening_stock",
        "units_received",
        "units_sold",
        "estimated_closing_stock",
        "unit_price",
        "discount_pct",
        "days_to_expiry_next_day",
        "temperature_c",
        "stockout_flag",
        "calendar_day_of_week",
        "calendar_month",
        "calendar_day_of_year_sin",
        "calendar_day_of_year_cos",
        "calendar_is_weekend",
    ]
    categorical_features = ["product_id", "category"]
    return (
        frame[
            ["as_of_date", "target_date", TARGET, *numeric_features, *categorical_features]
        ],
        numeric_features,
        categorical_features,
    )


def train() -> dict[str, object]:
    frame, numeric_features, categorical_features = prepare_food_waste_data()
    train_frame, test_frame, cutoff = chronological_split(frame, "target_date")
    candidates = {
        "median_baseline": lambda: DummyRegressor(strategy="median"),
        "random_forest": lambda: RandomForestRegressor(
            n_estimators=250,
            min_samples_leaf=2,
            max_features=0.8,
            n_jobs=-1,
            random_state=42,
        ),
        "extra_trees": lambda: ExtraTreesRegressor(
            n_estimators=250,
            min_samples_leaf=2,
            max_features=0.8,
            n_jobs=-1,
            random_state=42,
        ),
    }

    def make_model(estimator):
        return create_pipeline(estimator, numeric_features, categorical_features)

    model, selection = select_model(
        train_frame,
        TARGET,
        candidates,
        make_model,
        lambda data: chronological_split(data, "target_date")[:2],
        lambda fitted, data: regression_metrics(
            data[TARGET],
            fitted.predict(data[numeric_features + categorical_features]),
        ),
        "mae",
        maximize=False,
    )
    predictions = model.predict(test_frame[numeric_features + categorical_features])
    test_metrics = regression_metrics(test_frame[TARGET], predictions)
    baseline = regression_metrics(
        test_frame[TARGET],
        [train_frame[TARGET].mean()] * len(test_frame),
    )
    median_baseline = regression_metrics(
        test_frame[TARGET],
        [train_frame[TARGET].median()] * len(test_frame),
    )
    zero_baseline = regression_metrics(
        test_frame[TARGET],
        [0.0] * len(test_frame),
    )
    model = fit_final_model(candidates, selection, make_model, frame, TARGET)
    result: dict[str, object] = {
        "task": "next_day_food_waste_regression",
        "source": perishable_inventory_path().name,
        "target": TARGET,
        "excluded_target_columns": ["waste_units", TARGET],
        "prediction_horizon_days": 1,
        "feature_availability": (
            "Features are measured at as_of_date; the target is the next calendar "
            "day's waste. No waste outcome is used as an input."
        ),
        "split": "chronological_by_target_date",
        "test_cutoff": cutoff.isoformat(),
        "train_rows": int(len(train_frame)),
        "test_rows": int(len(test_frame)),
        "final_model_fit_rows": int(len(frame)),
        "final_model_fit_includes_holdout": True,
        "holdout_metrics_use_train_only_model": True,
        "train_date_range": [
            train_frame["target_date"].min().date().isoformat(),
            train_frame["target_date"].max().date().isoformat(),
        ],
        "test_date_range": [
            test_frame["target_date"].min().date().isoformat(),
            test_frame["target_date"].max().date().isoformat(),
        ],
        "features": numeric_features + categorical_features,
        "validation_model_selection": selection,
        "holdout_metrics": test_metrics,
        "training_mean_baseline_metrics": baseline,
        "training_median_baseline_metrics": median_baseline,
        "zero_waste_baseline_metrics": zero_baseline,
        "test_nonzero_waste_rate": float(test_frame[TARGET].gt(0).mean()),
        "data_quality_note": (
            "Waste targets are sparse. If the rolling validation comparison selects "
            "the median baseline, the supplied prior-day features did not show "
            "reliable signal beyond predicting the typical (often zero) outcome."
        ),
    }
    artifact_path = save_artifact("food_waste", model, result)
    result["artifact"] = artifact_path.name
    return result


if __name__ == "__main__":
    train()
