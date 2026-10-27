SET XACT_ABORT ON;
BEGIN TRANSACTION;

INSERT INTO dbo.products (
    product_id,
    product_name,
    category,
    shelf_life_days,
    selling_price,
    unit_cost
)
SELECT source.product_id, source.product_name, source.category,
       source.shelf_life_days, source.selling_price, source.unit_cost
FROM (VALUES
    (1001, N'Milk 500ml', N'Dairy', 5, 32.00, 24.00),
    (1002, N'Yogurt Cup', N'Dairy', 10, 25.00, 17.00),
    (1003, N'Bread Loaf', N'Bakery', 4, 40.00, 26.00),
    (1004, N'Paneer 200g', N'Dairy', 7, 85.00, 62.00),
    (1005, N'Spinach Pack', N'Produce', 3, 30.00, 18.00),
    (1006, N'Tomatoes 1kg', N'Produce', 7, 45.00, 28.00),
    (1007, N'Apple 1kg', N'Produce', 14, 120.00, 78.00),
    (1008, N'Orange Juice 1L', N'Beverage', 30, 95.00, 61.00),
    (1009, N'Fresh Cream', N'Dairy', 8, 60.00, 41.00),
    (1010, N'Muffin Pack', N'Bakery', 5, 55.00, 34.00)
) AS source (
    product_id, product_name, category, shelf_life_days, selling_price, unit_cost
)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.products AS existing
    WHERE existing.product_id = source.product_id
);

INSERT INTO dbo.inventory_batches (
    batch_id,
    product_id,
    received_at,
    snapshot_date,
    expiry_date,
    initial_quantity,
    quantity_remaining,
    days_to_expiry,
    avg_daily_sales_7d,
    expected_demand_before_expiry,
    unit_price,
    unit_cost,
    discount_pct,
    expiry_risk_label
)
SELECT source.batch_id, source.product_id, source.received_at,
       source.snapshot_date, source.expiry_date, source.initial_quantity,
       source.quantity_remaining, source.days_to_expiry,
       source.avg_daily_sales_7d, source.expected_demand_before_expiry,
       source.unit_price, source.unit_cost, source.discount_pct,
       source.expiry_risk_label
FROM (VALUES
    (5003, 1001, '2026-08-18', '2026-08-20', '2026-08-23', 22, 3, 3, 12.67, 38, 32.00, 24.00, 10.00, 1),
    (5027, 1002, '2026-09-18', '2026-09-30', '2026-09-28', 120, 120, -2, 23.53, 0, 25.00, 17.00, 20.00, 1),
    (5004, 1003, '2026-08-21', '2026-08-26', '2026-08-25', 141, 141, -1, 14.52, 0, 40.00, 26.00, 10.00, 1),
    (5013, 1004, '2026-07-30', '2026-08-06', '2026-08-06', 132, 132, 0, 18.26, 0, 85.00, 62.00, 0.00, 1),
    (5011, 1005, '2026-08-05', '2026-08-09', '2026-08-08', 15, 15, -1, 24.31, 0, 30.00, 18.00, 15.00, 0),
    (5001, 1006, '2026-08-14', '2026-08-16', '2026-08-21', 140, 72, 5, 23.38, 117, 45.00, 28.00, 5.00, 1),
    (5005, 1007, '2026-07-16', '2026-07-19', '2026-07-30', 139, 52, 11, 13.09, 144, 120.00, 78.00, 20.00, 1),
    (5006, 1008, '2026-08-09', '2026-09-07', '2026-09-08', 59, 36, 1, 36.04, 36, 95.00, 61.00, 5.00, 0),
    (5025, 1009, '2026-09-18', '2026-09-18', '2026-09-26', 130, 80, 8, 9.66, 77, 60.00, 41.00, 15.00, 1),
    (5007, 1010, '2026-07-17', '2026-07-21', '2026-07-22', 80, 73, 1, 9.34, 9, 55.00, 34.00, 0.00, 1)
) AS source (
    batch_id, product_id, received_at, snapshot_date, expiry_date,
    initial_quantity, quantity_remaining, days_to_expiry, avg_daily_sales_7d,
    expected_demand_before_expiry, unit_price, unit_cost, discount_pct,
    expiry_risk_label
)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.inventory_batches AS existing
    WHERE existing.batch_id = source.batch_id
);

INSERT INTO dbo.sales (
    product_id,
    sale_date,
    opening_stock,
    units_received,
    units_sold,
    unit_price,
    discount_pct,
    days_to_expiry,
    temperature_c,
    waste_units,
    stockout_flag
)
SELECT source.product_id, source.sale_date, source.opening_stock,
       source.units_received, source.units_sold, source.unit_price,
       source.discount_pct, source.days_to_expiry, source.temperature_c,
       source.waste_units, source.stockout_flag
FROM (VALUES
    (1001, '2026-09-21', 13, 0, 7, 32.00, 0.00, 0, 3.30, 0, 0),
    (1001, '2026-09-22', 18, 13, 8, 32.00, 0.00, 2, -0.40, 23, 0),
    (1001, '2026-09-23', 0, 0, 0, 32.00, 0.00, 2, 3.40, 0, 0),
    (1001, '2026-09-24', 36, 19, 9, 32.00, 0.00, 1, 2.60, 0, 0),
    (1001, '2026-09-25', 26, 0, 9, 28.80, 10.00, 2, 2.50, 0, 0),
    (1001, '2026-09-26', 13, 0, 11, 32.00, 0.00, 1, 4.70, 0, 0),
    (1001, '2026-09-27', 24, 0, 10, 32.00, 0.00, 4, 4.20, 0, 0),
    (1002, '2026-09-21', 37, 11, 24, 25.00, 0.00, 10, 4.60, 24, 0),
    (1002, '2026-09-22', 35, 0, 22, 25.00, 0.00, 8, 2.40, 0, 0),
    (1002, '2026-09-23', 46, 0, 24, 25.00, 0.00, 4, 4.60, 0, 0),
    (1002, '2026-09-24', 33, 0, 31, 25.00, 0.00, 2, 3.40, 0, 0),
    (1002, '2026-09-25', 45, 0, 26, 25.00, 0.00, 8, 1.00, 0, 0),
    (1002, '2026-09-26', 41, 0, 35, 25.00, 0.00, 9, 5.80, 0, 0),
    (1002, '2026-09-27', 49, 0, 37, 22.50, 10.00, 6, 4.80, 0, 0)
) AS source (
    product_id, sale_date, opening_stock, units_received, units_sold,
    unit_price, discount_pct, days_to_expiry, temperature_c, waste_units,
    stockout_flag
)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.sales AS existing
    WHERE existing.product_id = source.product_id
      AND existing.sale_date = source.sale_date
);

COMMIT TRANSACTION;