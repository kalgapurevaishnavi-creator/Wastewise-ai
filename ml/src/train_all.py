import json

from ml.src.train_discount_model import train as train_discount_model
from ml.src.train_expiry_risk import train as train_expiry_risk
from ml.src.train_forecast import train as train_forecast
from ml.src.train_waste_model import train as train_food_waste_model


def main() -> dict[str, dict[str, object]]:
    results = {
        "demand_forecast": train_forecast(),
        "expiry_risk": train_expiry_risk(),
        "food_waste": train_food_waste_model(),
        "discount_recommendation": train_discount_model(),
    }
    print(json.dumps(results, indent=2, allow_nan=False))
    return results


if __name__ == "__main__":
    main()
