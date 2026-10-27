import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor

from ml.src.training_common import (
    create_pipeline,
    fit_final_model,
    grouped_split,
    load_csv,
    regression_metrics,
    save_artifact,
    select_model,
)

TARGET = "estimated_gross_margin_simulated"
EXCLUDED_COLUMNS = (
    "batch_id",
    TARGET,
    "estimated_units_sold_simulated",
    "estimated_revenue_simulated",
)


def prepare_discount_data() -> tuple[pd.DataFrame, list[str], list[str]]:
    scenarios = load_csv("discount_scenarios_simulated.csv")
    products = load_csv("products.csv")
    required_scenarios = {
        "batch_id",
        "product_id",
        "days_to_expiry",
        "quantity_remaining",
        "discount_pct",
        TARGET,
    }
    missing = required_scenarios.difference(scenarios.columns)
    if missing:
        raise ValueError(f"Discount scenario data is missing columns: {sorted(missing)}")
    required_products = {
        "product_id",
        "category",
        "shelf_life_days",
        "selling_price",
        "unit_cost",
    }
    missing = required_products.difference(products.columns)
    if missing:
        raise ValueError(f"Product data is missing columns: {sorted(missing)}")

    features = scenarios[
        [
            "batch_id",
            "product_id",
            "days_to_expiry",
            "quantity_remaining",
            "discount_pct",
            TARGET,
        ]
    ].copy()
    product_features = products[
        [
            "product_id",
            "category",
            "shelf_life_days",
            "selling_price",
            "unit_cost",
        ]
    ].drop_duplicates("product_id")
    frame = features.merge(
        product_features,
        on="product_id",
        how="left",
        validate="many_to_one",
    )
    if frame[["category", "selling_price", "unit_cost"]].isna().any().any():
        raise ValueError("Some simulated scenarios do not have matching product data")
    frame["product_id"] = frame["product_id"].astype(str)
    frame["category"] = frame["category"].astype(str)
    numeric_features = [
        "days_to_expiry",
        "quantity_remaining",
        "discount_pct",
        "shelf_life_days",
        "selling_price",
        "unit_cost",
    ]
    categorical_features = ["product_id", "category"]
    return (
        frame[
            ["batch_id", TARGET, *numeric_features, *categorical_features]
        ],
        numeric_features,
        categorical_features,
    )


def train() -> dict[str, object]:
    frame, numeric_features, categorical_features = prepare_discount_data()
    train_frame, test_frame = grouped_split(frame, "batch_id")
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
        TARGET,
        candidates,
        make_model,
        lambda data: grouped_split(
            data, "batch_id", random_state=43
        ),
        lambda fitted, data: _regression_metrics(
            data[TARGET],
            fitted.predict(data[numeric_features + categorical_features]),
        ),
        "mae",
        maximize=False,
    )
    predictions = model.predict(test_frame[numeric_features + categorical_features])
    holdout_metrics = _regression_metrics(test_frame[TARGET], predictions)
    recommendation_metrics = _recommendation_metrics(
        test_frame, predictions, numeric_features, categorical_features
    )
    model = fit_final_model(candidates, selection, make_model, frame, TARGET)
    result: dict[str, object] = {
        "task": "simulated_discount_gross_margin_regression",
        "source": "discount_scenarios_simulated.csv",
        "target": TARGET,
        "excluded_target_columns": list(EXCLUDED_COLUMNS),
        "split": "grouped_by_batch_id",
        "train_batches": int(train_frame["batch_id"].nunique()),
        "test_batches": int(test_frame["batch_id"].nunique()),
        "train_rows": int(len(train_frame)),
        "test_rows": int(len(test_frame)),
        "final_model_fit_rows": int(len(frame)),
        "final_model_fit_includes_holdout": True,
        "holdout_metrics_use_train_only_model": True,
        "features": numeric_features + categorical_features,
        "validation_model_selection": selection,
        "holdout_metrics": holdout_metrics,
        "holdout_recommendation_metrics": recommendation_metrics,
        "limitation": (
            "Scenario outcomes are simulated. These results are a prototype and "
            "are not evidence of real customer price response."
        ),
    }
    artifact_path = save_artifact("discount_recommendation", model, result)
    result["artifact"] = artifact_path.name
    return result


def _regression_metrics(actual: pd.Series, predicted: np.ndarray) -> dict[str, float]:
    return regression_metrics(actual, predicted)


def _recommendation_metrics(
    test_frame: pd.DataFrame,
    predictions: np.ndarray,
    numeric_features: list[str],
    categorical_features: list[str],
) -> dict[str, float]:
    scored = test_frame[
        ["batch_id", TARGET, *numeric_features, *categorical_features]
    ].copy()
    scored["predicted_gross_margin"] = predictions
    recommended = scored.loc[
        scored.groupby("batch_id")["predicted_gross_margin"].idxmax()
    ]
    oracle = scored.loc[scored.groupby("batch_id")[TARGET].idxmax()]
    no_discount = scored.loc[scored["discount_pct"].eq(0)]
    baseline = no_discount.groupby("batch_id")[TARGET].max()
    oracle_by_batch = oracle.set_index("batch_id")[TARGET]
    recommended_by_batch = recommended.set_index("batch_id")[TARGET]
    match_rates = (
        recommended.set_index("batch_id")["discount_pct"]
        == oracle.set_index("batch_id")["discount_pct"]
    )
    regret = oracle_by_batch - recommended_by_batch
    return {
        "mean_regret_vs_best_simulated_scenario": float(regret.mean()),
        "mean_simulated_margin_at_recommended_discount": float(
            recommended[TARGET].mean()
        ),
        "mean_simulated_margin_at_zero_discount": float(baseline.mean()),
        "best_discount_match_rate": float(match_rates.mean()),
    }


if __name__ == "__main__":
    train()
