# Database design

The SQL Server scripts in `database/` define the initial WasteWise relational
schema and a small, rerunnable demo seed. Run `schema.sql` first, then
`seed_data.sql`, using a SQL Server client that supports `GO` batch separators.
The backend connection is configured through `SQL_SERVER`, `SQL_DATABASE`, and
`SQL_DRIVER` in `backend/app/db/session.py`.

## Tables

- `dbo.products` stores the product catalog, shelf life, and current list price
  and unit cost.
- `dbo.inventory_batches` stores batch-level receipt, snapshot, expiry,
  remaining quantity, sales-rate features, and the supplied expiry-risk label.
  `waste_units_actual_simulated` is nullable and is not populated by the seed.
- `dbo.sales` stores daily per-product stock, sales, price/promotion, temperature,
  waste, and stockout observations. A product can have at most one row per date.
- `dbo.model_predictions` is the persistence point for future model outputs. It
  distinguishes forecast, expiry-risk, food-waste, and discount-recommendation
  predictions, and can associate a prediction with a product and/or batch.

Foreign keys keep batches, sales, and predictions tied to the product catalog.
Checks constrain nonnegative quantities and prices, discount percentages, and
prediction confidence. Indexes cover expiry lookups, date-based sales queries,
and prediction type/target-date queries.

## Seed data and limitations

The seed inserts the ten demo catalog products and ten representative inventory
batches used by the frontend. It adds fourteen daily sales rows for products
1001 and 1002 from the supplied perishable inventory CSV (2026-09-21 through
2026-09-27). Re-running the seed does not duplicate product IDs, batch IDs, or
product/date sales rows.

This is deliberately a compact development seed, not a full import of the CSV
history. Expiry labels and the demo data are supplied/simulated values; they
should not be interpreted as independently verified operational outcomes.
No demo users or credentials are created.