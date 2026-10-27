from pathlib import Path

import pandas as pd
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


def prepare_forecast_data() -> tuple[pd.DataFrame, list[str], list[str]]:
    history = load_perishable_inventory()
    required = {
        "date",
        "product_id",
        "category",
        "units_sold",
        "unit_price",
        "discount_pct",
    }
    missing = required.difference(history.columns)
    if missing:
        raise ValueError(f"Demand forecasting data is missing columns: {sorted(missing)}")

    history["date"] = pd.to_datetime(history["date"], errors="raise")
    for column in ("units_sold", "unit_price", "discount_pct"):
        history[column] = pd.to_numeric(history[column], errors="raise")
    history = history.sort_values(["product_id", "date"]).reset_index(drop=True)
    grouped = history.groupby("product_id", sort=False)

    frame = pd.DataFrame(
        {
            "target_date": history["date"],
            "product_id": history["product_id"].astype(str),
            "category": history["category"].astype(str),
            "target_units_sold": history["units_sold"],
        }
    )
    numeric_features = [
        "sales_lag_1",
        "sales_lag_7",
        "sales_lag_28",
        "sales_mean_7d",
        "sales_mean_28d",
        "unit_price_lag_1",
        "discount_pct_lag_1",
        "promotion_active_lag_1",
        "calendar_day_of_week",
        "calendar_month",
        "calendar_day_of_year_sin",
        "calendar_day_of_year_cos",
        "calendar_is_weekend",
    ]
    for lag in (1, 7, 28):
        frame[f"sales_lag_{lag}"] = grouped["units_sold"].shift(lag)
    frame["unit_price_lag_1"] = grouped["unit_price"].shift(1)
    frame["discount_pct_lag_1"] = grouped["discount_pct"].shift(1)
    frame["promotion_active_lag_1"] = (
        frame["discount_pct_lag_1"].fillna(0).gt(0).astype(int)
    )
    previous_sales = grouped["units_sold"].shift(1)
    for window in (7, 28):
        frame[f"sales_mean_{window}d"] = (
            previous_sales.groupby(history["product_id"], sort=False)
            .rolling(window, min_periods=1)
            .mean()
            .reset_index(level=0, drop=True)
        )

    frame = add_calendar_features(frame, frame["target_date"])
    frame = frame.dropna(subset=["sales_lag_1", "sales_lag_7", "sales_lag_28"])
    frame["target_units_sold"] = pd.to_numeric(
        frame["target_units_sold"], errors="raise"
    )
    frame = frame.sort_values(["target_date", "product_id"]).reset_index(drop=True)
    return frame, numeric_features, ["product_id", "category"]


def train() -> dict[str, object]:
    frame, numeric_features, categorical_features = prepare_forecast_data()
    train_frame, test_frame, cutoff = chronological_split(frame, "target_date")
    target = "target_units_sold"
    candidates = {
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
        target,
        candidates,
        make_model,
        lambda data: chronological_split(data, "target_date")[:2],
        lambda fitted, data: regression_metrics(
            data[target], fitted.predict(data[numeric_features + categorical_features])
        ),
        "mae",
        maximize=False,
    )
    predictions = model.predict(test_frame[numeric_features + categorical_features])
    test_metrics = regression_metrics(test_frame[target], predictions)
    baseline = regression_metrics(
        test_frame[target], test_frame["sales_lag_1"]
    )
    model = fit_final_model(candidates, selection, make_model, frame, target)

    result: dict[str, object] = {
        "task": "one_day_ahead_demand_forecasting",
        "source": perishable_inventory_path().name,
        "source_note": (
            "Historical units_sold are taken from the available perishable inventory "
            "file; calendar features are derived from each date because calendar.csv "
            "does not cover these 2026 observations."
        ),
        "target": target,
        "excluded_target_columns": [target, "units_sold"],
        "prediction_horizon_days": 1,
        "split": "chronological",
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
        "lag_1_baseline_metrics": baseline,
    }
    artifact_path = save_artifact("demand_forecast", model, result)
    result["artifact"] = artifact_path.name
    return result


if __name__ == "__main__":
    train()
