IF OBJECT_ID(N'dbo.products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.products (
        product_id INT NOT NULL CONSTRAINT PK_products PRIMARY KEY,
        product_name NVARCHAR(100) NOT NULL,
        category NVARCHAR(40) NOT NULL,
        shelf_life_days INT NOT NULL,
        selling_price DECIMAL(10, 2) NOT NULL,
        unit_cost DECIMAL(10, 2) NOT NULL,
        created_at DATETIME2(0) NOT NULL
            CONSTRAINT DF_products_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_products_shelf_life CHECK (shelf_life_days > 0),
        CONSTRAINT CK_products_selling_price CHECK (selling_price >= 0),
        CONSTRAINT CK_products_unit_cost CHECK (unit_cost >= 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.inventory_batches', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inventory_batches (
        batch_id INT NOT NULL CONSTRAINT PK_inventory_batches PRIMARY KEY,
        product_id INT NOT NULL,
        received_at DATE NOT NULL,
        snapshot_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        initial_quantity INT NOT NULL,
        quantity_remaining INT NOT NULL,
        days_to_expiry INT NOT NULL,
        avg_daily_sales_7d DECIMAL(10, 2) NOT NULL,
        expected_demand_before_expiry INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        unit_cost DECIMAL(10, 2) NOT NULL,
        discount_pct DECIMAL(5, 2) NOT NULL
            CONSTRAINT DF_inventory_batches_discount_pct DEFAULT 0,
        expiry_risk_label BIT NOT NULL,
        waste_units_actual_simulated INT NULL,
        created_at DATETIME2(0) NOT NULL
            CONSTRAINT DF_inventory_batches_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_inventory_batches_products
            FOREIGN KEY (product_id) REFERENCES dbo.products (product_id),
        CONSTRAINT CK_inventory_batches_initial_quantity
            CHECK (initial_quantity >= 0),
        CONSTRAINT CK_inventory_batches_quantity_remaining
            CHECK (quantity_remaining >= 0),
        CONSTRAINT CK_inventory_batches_sales CHECK (avg_daily_sales_7d >= 0),
        CONSTRAINT CK_inventory_batches_expected_demand
            CHECK (expected_demand_before_expiry >= 0),
        CONSTRAINT CK_inventory_batches_unit_price CHECK (unit_price >= 0),
        CONSTRAINT CK_inventory_batches_unit_cost CHECK (unit_cost >= 0),
        CONSTRAINT CK_inventory_batches_discount_pct
            CHECK (discount_pct BETWEEN 0 AND 100),
        CONSTRAINT CK_inventory_batches_simulated_waste
            CHECK (waste_units_actual_simulated IS NULL OR waste_units_actual_simulated >= 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.sales', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sales (
        sale_id BIGINT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_sales PRIMARY KEY,
        product_id INT NOT NULL,
        sale_date DATE NOT NULL,
        opening_stock INT NOT NULL,
        units_received INT NOT NULL,
        units_sold INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        discount_pct DECIMAL(5, 2) NOT NULL
            CONSTRAINT DF_sales_discount_pct DEFAULT 0,
        days_to_expiry INT NOT NULL,
        temperature_c DECIMAL(5, 2) NOT NULL,
        waste_units INT NOT NULL
            CONSTRAINT DF_sales_waste_units DEFAULT 0,
        stockout_flag BIT NOT NULL
            CONSTRAINT DF_sales_stockout_flag DEFAULT 0,
        created_at DATETIME2(0) NOT NULL
            CONSTRAINT DF_sales_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_sales_products
            FOREIGN KEY (product_id) REFERENCES dbo.products (product_id),
        CONSTRAINT UQ_sales_product_date UNIQUE (product_id, sale_date),
        CONSTRAINT CK_sales_opening_stock CHECK (opening_stock >= 0),
        CONSTRAINT CK_sales_units_received CHECK (units_received >= 0),
        CONSTRAINT CK_sales_units_sold CHECK (units_sold >= 0),
        CONSTRAINT CK_sales_unit_price CHECK (unit_price >= 0),
        CONSTRAINT CK_sales_discount_pct CHECK (discount_pct BETWEEN 0 AND 100),
        CONSTRAINT CK_sales_waste_units CHECK (waste_units >= 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.model_predictions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.model_predictions (
        prediction_id BIGINT IDENTITY(1, 1) NOT NULL
            CONSTRAINT PK_model_predictions PRIMARY KEY,
        prediction_type NVARCHAR(40) NOT NULL,
        product_id INT NULL,
        batch_id INT NULL,
        prediction_date DATE NOT NULL,
        target_date DATE NULL,
        predicted_value DECIMAL(18, 4) NOT NULL,
        confidence DECIMAL(5, 4) NULL,
        model_version NVARCHAR(80) NOT NULL,
        created_at DATETIME2(0) NOT NULL
            CONSTRAINT DF_model_predictions_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_model_predictions_products
            FOREIGN KEY (product_id) REFERENCES dbo.products (product_id),
        CONSTRAINT FK_model_predictions_inventory_batches
            FOREIGN KEY (batch_id) REFERENCES dbo.inventory_batches (batch_id),
        CONSTRAINT CK_model_predictions_type CHECK (
            prediction_type IN (
                N'demand_forecast',
                N'expiry_risk',
                N'food_waste',
                N'discount_recommendation'
            )
        ),
        CONSTRAINT CK_model_predictions_confidence CHECK (
            confidence IS NULL OR confidence BETWEEN 0 AND 1
        ),
        CONSTRAINT CK_model_predictions_entity CHECK (
            product_id IS NOT NULL OR batch_id IS NOT NULL
        )
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_inventory_batches_expiry_date'
      AND object_id = OBJECT_ID(N'dbo.inventory_batches')
)
    CREATE INDEX IX_inventory_batches_expiry_date
        ON dbo.inventory_batches (expiry_date, product_id);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_sales_sale_date'
      AND object_id = OBJECT_ID(N'dbo.sales')
)
    CREATE INDEX IX_sales_sale_date
        ON dbo.sales (sale_date, product_id);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_model_predictions_type_target_date'
      AND object_id = OBJECT_ID(N'dbo.model_predictions')
)
    CREATE INDEX IX_model_predictions_type_target_date
        ON dbo.model_predictions (prediction_type, target_date);
GO