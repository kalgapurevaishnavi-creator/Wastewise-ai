# ML model training

Run these commands from the project root in PowerShell:

```powershell
.\.venv\Scripts\python.exe -m pip install -r .\ml\requirements.txt
.\.venv\Scripts\python.exe -B -m unittest discover -s .\ml\tests -v
.\.venv\Scripts\python.exe -B -m ml.src.train_all
```

The training run saves four joblib pipelines and their chronological or grouped
holdout metrics under `ml/artifacts/`. `metrics.json` records the selected
validation model, holdout scores, training data, feature list, and split details.
For individual models, run `-m ml.src.train_forecast`,
`-m ml.src.train_expiry_risk`, `-m ml.src.train_waste_model`, or
`-m ml.src.train_discount_model`.

Demand history is read from `ml/data/raw/perishable_inventory.csv` if present.
The supplied file is currently named `perishable_inventory copy.csv`, which is
also supported. The `calendar.csv` dates do not overlap the supplied 2026
perishable records, so forecast calendar features are calculated from each
record's date. One-day-ahead targets use prior sales, price, and discount
features, with the final 20% of target dates held out.

The food-waste model predicts the next calendar day's `waste_units` from
information on the preceding day; `waste_units` is never a feature. The expiry
risk model excludes both `expiry_risk_label` and the simulated waste outcome
from its features. The discount model is trained on `discount_scenarios_simulated.csv`,
keeps each batch wholly within one split, and is only a simulation-based
prototype—not evidence of real customer price response.

Holdout scores are written as measured; training cannot guarantee high accuracy
when historical labels have little predictive signal. In particular, inspect
the food-waste baseline scores and nonzero target rate before using that model
for operational decisions.
