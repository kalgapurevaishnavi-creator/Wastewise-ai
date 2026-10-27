import unittest

import pandas as pd

from ml.src.train_discount_model import (
    EXCLUDED_COLUMNS,
    prepare_discount_data,
)
from ml.src.train_expiry_risk import (
    EXCLUDED_COLUMNS as EXPIRY_EXCLUDED_COLUMNS,
    prepare_expiry_risk_data,
)
from ml.src.train_forecast import prepare_forecast_data
from ml.src.train_waste_model import TARGET as WASTE_TARGET
from ml.src.train_waste_model import prepare_food_waste_data
from ml.src.training_common import (
    chronological_split,
    grouped_split,
    load_perishable_inventory,
)


class TrainingFeatureTests(unittest.TestCase):
    def test_forecast_features_use_prior_day_sales_price_and_promotion(self) -> None:
        frame, numeric_features, categorical_features = prepare_forecast_data()
        features = numeric_features + categorical_features
        self.assertIn("sales_lag_1", features)
        self.assertIn("unit_price_lag_1", features)
        self.assertIn("discount_pct_lag_1", features)
        self.assertIn("calendar_day_of_week", features)
        self.assertNotIn("target_units_sold", features)
        self.assertNotIn("units_sold", features)
        self.assertTrue(frame["target_date"].is_monotonic_increasing)
        source = load_perishable_inventory()
        source["date"] = pd.to_datetime(source["date"])
        first = frame.iloc[0]
        prior_day = source.loc[
            source["product_id"].astype(str).eq(first["product_id"])
            & source["date"].eq(first["target_date"] - pd.Timedelta(days=1))
        ].iloc[0]
        self.assertEqual(first["sales_lag_1"], prior_day["units_sold"])
        self.assertEqual(first["unit_price_lag_1"], prior_day["unit_price"])
        self.assertEqual(first["discount_pct_lag_1"], prior_day["discount_pct"])

    def test_expiry_risk_label_and_simulated_waste_are_excluded(self) -> None:
        frame, numeric_features, categorical_features = prepare_expiry_risk_data()
        self.assertNotIn("expiry_risk_label", numeric_features + categorical_features)
        self.assertTrue(set(EXPIRY_EXCLUDED_COLUMNS).isdisjoint(numeric_features))
        self.assertEqual(set(frame["expiry_risk_label"].unique()), {0, 1})

    def test_food_waste_features_precede_the_next_day_target(self) -> None:
        frame, numeric_features, categorical_features = prepare_food_waste_data()
        features = numeric_features + categorical_features
        self.assertNotIn("waste_units", features)
        self.assertNotIn(WASTE_TARGET, features)
        self.assertTrue(
            (frame["target_date"] == frame["as_of_date"] + pd.Timedelta(days=1)).all()
        )
        self.assertGreater(len(frame), 0)
        source = load_perishable_inventory()
        source["date"] = pd.to_datetime(source["date"])
        first = frame.iloc[0]
        prior_day = source.loc[
            source["product_id"].astype(str).eq(first["product_id"])
            & source["date"].eq(first["as_of_date"])
        ].iloc[0]
        following_day = source.loc[
            source["product_id"].astype(str).eq(first["product_id"])
            & source["date"].eq(first["target_date"])
        ].iloc[0]
        self.assertEqual(first["units_sold"], prior_day["units_sold"])
        self.assertEqual(first[WASTE_TARGET], following_day["waste_units"])

    def test_discount_features_exclude_simulated_outcomes_and_batch_id(self) -> None:
        _, numeric_features, categorical_features = prepare_discount_data()
        features = numeric_features + categorical_features
        self.assertTrue(set(EXCLUDED_COLUMNS).isdisjoint(features))
        self.assertIn("discount_pct", features)
        self.assertIn("unit_cost", features)

    def test_time_and_batch_splits_keep_groups_separate(self) -> None:
        forecast, _, _ = prepare_forecast_data()
        train_dates, test_dates, _ = chronological_split(forecast, "target_date")
        self.assertLess(train_dates["target_date"].max(), test_dates["target_date"].min())

        scenarios, _, _ = prepare_discount_data()
        train_batches, test_batches = grouped_split(scenarios, "batch_id")
        self.assertTrue(
            set(train_batches["batch_id"]).isdisjoint(test_batches["batch_id"])
        )


if __name__ == "__main__":
    unittest.main()
