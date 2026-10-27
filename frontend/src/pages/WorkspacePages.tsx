import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  categories,
  dataNotes,
  demandProjection,
  inventoryBatches,
  modelMetrics,
  products,
  recentSales,
  wasteByCategory,
} from "../data/demoData";
import {
  Bars,
  CategoryBars,
  DataNotice,
  EmptyState,
  ExportButton,
  formatCurrency,
  formatNumber,
  MetricCard,
  PageHeading,
  Panel,
  SearchField,
  StatusPill,
  TableFrame,
} from "../components/PageContent";

const inventoryExportRows = inventoryBatches.map((batch) => ({
  batch_id: batch.id,
  product: batch.product,
  category: batch.category,
  snapshot_date: batch.snapshotDate,
  expiry_date: batch.expiryDate,
  quantity_remaining: batch.quantity,
  days_to_expiry: batch.daysToExpiry,
  expiry_risk_label: Number(batch.risk),
}));

function SearchAndCategory({
  search,
  onSearch,
  category,
  onCategory,
  searchLabel,
}: {
  search: string;
  onSearch: (value: string) => void;
  category: string;
  onCategory: (value: string) => void;
  searchLabel: string;
}) {
  return (
    <div className="ww-table-tools">
      <SearchField
        label={searchLabel}
        onChange={onSearch}
        placeholder="Search by name or ID..."
        value={search}
      />
      <label className="ww-select-wrap">
        <span className="ww-sr-only">Filter by category</span>
        <select onChange={(event) => onCategory(event.target.value)} value={category}>
          {categories.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <span aria-hidden="true">⌄</span>
      </label>
    </div>
  );
}

function RiskTag({ risk }: { risk: boolean }) {
  return (
    <StatusPill tone={risk ? "rose" : "green"}>
      <span className="ww-pill-dot" />
      {risk ? "Flagged in CSV" : "Not flagged"}
    </StatusPill>
  );
}

export function DashboardPage() {
  const riskPercent = (dataNotes.flaggedBatches / dataNotes.totalBatches) * 100;
  const dailyWaste = recentSales.reduce((sum, day) => sum + day.waste, 0);

  return (
    <>
      <PageHeading
        eyebrow="PROJECT OVERVIEW"
        title="Good morning. Here's your store at a glance."
        description="A clear view of stock, sales, and waste from the bundled WasteWise project dataset."
        action={<Link className="ww-button ww-button-primary" to="/inventory">View inventory <span aria-hidden="true">→</span></Link>}
      />
      <DataNotice>
        These are read-only sample figures from project CSV files. Sales span{" "}
        {dataNotes.salesStart}–{dataNotes.salesEnd}; inventory snapshots span{" "}
        {dataNotes.batchStart}–{dataNotes.batchEnd}. They are not live store figures.
      </DataNotice>

      <div className="ww-metric-grid">
        <MetricCard detail="Across the bundled inventory file" icon="▦" label="Inventory batches" tone="green" value={formatNumber(dataNotes.totalBatches)} />
        <MetricCard detail={`${riskPercent.toFixed(1)}% of supplied batch labels`} icon="!" label="Batches flagged at risk" tone="amber" value={formatNumber(dataNotes.flaggedBatches)} />
        <MetricCard detail="Summed batch quantities in the sample" icon="◫" label="Units on hand" tone="blue" value={formatNumber(dataNotes.totalOnHand)} />
        <MetricCard detail={`${formatNumber(dataNotes.totalWaste)} waste units in 180 days`} icon="↘" label="Historical units sold" tone="rose" value={formatNumber(dataNotes.totalSold)} />
      </div>

      <div className="ww-dashboard-grid">
        <Panel
          action={<Link className="ww-text-link" to="/sales">Full sales history <span aria-hidden="true">↗</span></Link>}
          className="ww-dashboard-sales"
          subtitle="Units sold per day · 21–27 Sep 2026"
          title="Sales this week"
        >
          <Bars
            color="green"
            label="Sales by day from September 21 to 27, 2026"
            values={recentSales.map((day) => ({
              label: new Date(`${day.date}T12:00:00`).toLocaleDateString("en", { weekday: "short" }),
              value: day.sales,
            }))}
          />
          <div className="ww-chart-footnote">
            <span><i className="ww-legend-dot ww-legend-green" /> Recorded units sold</span>
            <span>Sample · 7 days</span>
          </div>
        </Panel>

        <Panel
          action={<Link className="ww-text-link" to="/expiry-risk">See all <span aria-hidden="true">→</span></Link>}
          className="ww-dashboard-category"
          subtitle="Batch counts from inventory_batches.csv"
          title="Expiry risk by category"
        >
          <CategoryBars
            formatter={formatNumber}
            measure="batches"
            values={[
              { name: "Dairy", count: 487, color: "#608462" },
              { name: "Produce", count: 368, color: "#8aa274" },
              { name: "Bakery", count: 284, color: "#c3a36d" },
              { name: "Beverage", count: 33, color: "#97a9a1" },
            ]}
          />
          <div className="ww-chart-footnote"><span>1,172 flagged of 2,000 supplied labels</span></div>
        </Panel>
      </div>

      <Panel
        action={<Link className="ww-text-link" to="/waste">Open waste report <span aria-hidden="true">↗</span></Link>}
        className="ww-dashboard-bottom"
        subtitle="Observed daily waste · 21–27 Sep 2026"
        title="Waste signal"
      >
        <div className="ww-waste-summary">
          <div className="ww-waste-icon">↘</div>
          <div><strong>{formatNumber(dailyWaste)} units</strong><span>recorded across the last 7 source dates</span></div>
          <span className="ww-muted">Historical dataset only</span>
        </div>
        <div className="ww-bottom-links">
          <Link to="/forecasts"><span className="ww-link-icon">⌁</span><span><strong>Demand forecast</strong><small>View the chronological model evaluation</small></span><span>→</span></Link>
          <Link to="/models"><span className="ww-link-icon">◷</span><span><strong>Model performance</strong><small>See validation scores and limitations</small></span><span>→</span></Link>
        </div>
      </Panel>
    </>
  );
}

export function InventoryPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(searchQuery);
  const [category, setCategory] = useState("All categories");
  const [status, setStatus] = useState("all");
  useEffect(() => setSearch(searchQuery), [searchQuery]);
  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return inventoryBatches.filter((batch) => {
      const matchesText = !query || `${batch.id} ${batch.product} ${batch.category}`.toLowerCase().includes(query);
      const matchesCategory = category === "All categories" || batch.category === category;
      const matchesStatus = status === "all" || (status === "flagged" ? batch.risk : !batch.risk);
      return matchesText && matchesCategory && matchesStatus;
    });
  }, [category, search, status]);

  return (
    <>
      <PageHeading
        eyebrow="INVENTORY"
        title="Inventory"
        description="Browse the example batches and stock levels included in the project dataset."
        action={<ExportButton filename="wastewise-inventory-sample.csv" rows={inventoryExportRows} />}
      />
      <div className="ww-metric-grid ww-metric-grid-three">
        <MetricCard detail="All rows in inventory_batches.csv" icon="▦" label="Sample batches" value={formatNumber(dataNotes.totalBatches)} />
        <MetricCard detail="Summed quantity_remaining column" icon="◫" label="Sample units on hand" tone="blue" value={formatNumber(dataNotes.totalOnHand)} />
        <MetricCard detail="Supplied expiry_risk_label = 1" icon="!" label="Labelled at risk" tone="amber" value={formatNumber(dataNotes.flaggedBatches)} />
      </div>
      <Panel
        className="ww-table-panel"
        subtitle="Sample rows shown below; filters apply to this preview, not a live database."
        title="Example batch records"
      >
        <div className="ww-inline-filters">
          <SearchAndCategory
            category={category}
            onCategory={setCategory}
            onSearch={setSearch}
            search={search}
            searchLabel="Search inventory examples"
          />
          <label className="ww-select-wrap ww-status-select">
            <span className="ww-sr-only">Filter by risk status</span>
            <select onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="all">All statuses</option>
              <option value="flagged">Flagged in CSV</option>
              <option value="clear">Not flagged</option>
            </select>
            <span aria-hidden="true">⌄</span>
          </label>
        </div>
        {filteredBatches.length > 0 ? (
          <TableFrame>
            <table>
              <thead><tr><th>Batch / product</th><th>Category</th><th>Snapshot date</th><th>Expires</th><th>Units left</th><th>Days to expiry</th><th>Source label</th></tr></thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <tr key={batch.id}>
                    <td><strong>#{batch.id}</strong><span className="ww-cell-subtitle">{batch.product}</span></td>
                    <td>{batch.category}</td>
                    <td>{batch.snapshotDate}</td>
                    <td>{batch.expiryDate}</td>
                    <td>{formatNumber(batch.quantity)}</td>
                    <td className={batch.daysToExpiry < 0 ? "ww-overdue" : ""}>{batch.daysToExpiry}</td>
                    <td><RiskTag risk={batch.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>
        ) : <EmptyState title="No example batches match">Try another search or category.</EmptyState>}
        <div className="ww-table-footer">Showing {filteredBatches.length} of {inventoryBatches.length} example rows · {formatNumber(dataNotes.totalBatches)} rows in source file</div>
      </Panel>
      <DataNotice>
        Batch examples show the supplied CSV snapshot dates and labels; some dates are historical or later than the current date. This sample is not current inventory.
      </DataNotice>
    </>
  );
}

export function DemandForecastPage() {
  return (
    <>
      <PageHeading
        eyebrow="DEMAND PLANNING"
        title="Demand forecast"
        description="A one-day-ahead sales model trained on historical transactions, lag features, prices, promotions, and calendar signals."
        action={<Link className="ww-button ww-button-secondary" to="/models">Model details <span aria-hidden="true">→</span></Link>}
      />
      <DataNotice>
        Illustrative projection from the saved model at the end of its source history ({dataNotes.salesEnd}). The CSV ends on that date; these are model outputs, not current store forecasts or observed sales.
      </DataNotice>
      <div className="ww-metric-grid ww-metric-grid-three">
        <MetricCard detail="Lower is better · chronological holdout" icon="⌁" label="Holdout MAE" value="3.85 units" />
        <MetricCard detail="Chronological test set · 310 rows" icon="◷" label="Holdout R²" tone="blue" value="0.722" />
        <MetricCard detail="Lag-1 baseline MAE: 5.36 units" icon="↗" label="MAE vs baseline" tone="green" value="−28.2%" />
      </div>
      <Panel
        className="ww-forecast-panel"
        subtitle="One-day-ahead model output for the 7 days following the final source date."
        title="Illustrative 7-day projection"
      >
        <Bars
          color="blue"
          label="Model forecast for September 28 to October 4, 2026"
          valueLabel={(value) => `${value.toFixed(0)} units`}
          values={demandProjection.map((day) => ({
            label: new Date(`${day.date}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" }),
            value: day.forecast,
          }))}
        />
        <div className="ww-chart-footnote">
          <span><i className="ww-legend-dot ww-legend-blue" /> Model output · not actual sales</span>
          <span>Projected total: {formatNumber(Math.round(demandProjection.reduce((sum, day) => sum + day.forecast, 0)))} units</span>
        </div>
      </Panel>
      <Panel className="ww-table-panel" subtitle="These are predictions from the saved artifact, not ground-truth results." title="Daily projection">
        <TableFrame>
          <table>
            <thead><tr><th>Date</th><th>Predicted units sold</th><th>Output type</th></tr></thead>
            <tbody>{demandProjection.map((day) => (
              <tr key={day.date}>
                <td>{day.date}</td><td><strong>{day.forecast.toFixed(1)}</strong></td>
                <td><StatusPill tone="blue">Model projection</StatusPill></td>
              </tr>
            ))}</tbody>
          </table>
        </TableFrame>
      </Panel>
      <DataNotice>
        Training/validation uses a chronological split (test: 28 Aug–27 Sep 2026). Features include lagged sales, price, discount/promotion and derived calendar signals. See <Link to="/models">model performance</Link> for the full methodology.
      </DataNotice>
    </>
  );
}

export function ExpiryRiskPage() {
  const riskyCount = inventoryBatches.filter((batch) => batch.risk).length;

  return (
    <>
      <PageHeading
        eyebrow="FRESHNESS MONITOR"
        title="Expiry risk"
        description="Inspect sample batch expiry dates and the classifier's chronological holdout performance."
        action={<Link className="ww-button ww-button-secondary" to="/inventory">All inventory <span aria-hidden="true">→</span></Link>}
      />
      <div className="ww-metric-grid ww-metric-grid-three">
        <MetricCard detail="Among 2,000 supplied batch records" icon="!" label="Risk labels in source" tone="amber" value={`${formatNumber(dataNotes.flaggedBatches)} · ${(dataNotes.flaggedBatches / dataNotes.totalBatches * 100).toFixed(1)}%`} />
        <MetricCard detail="Held-out batches · chronological split" icon="◷" label="Model ROC-AUC" tone="green" value={modelMetrics.expiry.rocAuc.toFixed(3)} />
        <MetricCard detail="Compared with 0.500 majority baseline" icon="✓" label="Balanced accuracy" tone="blue" value={modelMetrics.expiry.balancedAccuracy.toFixed(3)} />
      </div>
      <DataNotice>
        The table below shows the CSV's supplied <code>expiry_risk_label</code>, not predictions from a running model. The score cards are separate, held-out evaluation metrics; no live batch scoring or alerting is connected.
      </DataNotice>
      <Panel className="ww-table-panel" subtitle="One example record per product · source labels are simulated project data." title="Example batch risk labels">
        <TableFrame>
          <table>
            <thead><tr><th>Batch</th><th>Product</th><th>Snapshot</th><th>Days to expiry</th><th>Units left</th><th>Supplied risk label</th></tr></thead>
            <tbody>{inventoryBatches.map((batch) => (
              <tr key={batch.id}>
                <td><strong>#{batch.id}</strong></td><td>{batch.product}</td><td>{batch.snapshotDate}</td>
                <td className={batch.daysToExpiry < 0 ? "ww-overdue" : ""}>{batch.daysToExpiry}</td>
                <td>{formatNumber(batch.quantity)}</td><td><RiskTag risk={batch.risk} /></td>
              </tr>
            ))}</tbody>
          </table>
        </TableFrame>
        <div className="ww-table-footer">{riskyCount} of these {inventoryBatches.length} illustrative rows are labelled at risk in the source.</div>
      </Panel>
    </>
  );
}

const scenarioOutcomes = [
  { discount: 0, units: 72, revenue: 3240, margin: 1224 },
  { discount: 5, units: 72, revenue: 3078, margin: 1062 },
  { discount: 10, units: 72, revenue: 2916, margin: 900 },
  { discount: 15, units: 72, revenue: 2754, margin: 738 },
  { discount: 20, units: 72, revenue: 2592, margin: 576 },
];

export function RecommendationsPage() {
  const bestScenario = scenarioOutcomes.reduce((best, current) => current.margin > best.margin ? current : best);

  return (
    <>
      <PageHeading
        eyebrow="PRICING LAB"
        title="Discount recommendations"
        description="Explore the prototype's simulated discount scenarios—never treat them as proven customer price response."
        action={<Link className="ww-button ww-button-secondary" to="/models">View validation <span aria-hidden="true">→</span></Link>}
      />
      <div className="ww-simulated-banner">
        <span aria-hidden="true">◇</span>
        <div><strong>Prototype using simulated scenario data</strong><p>The scenario generator is synthetic. Model accuracy here is not evidence that shoppers will respond to real price changes this way.</p></div>
      </div>
      <div className="ww-metric-grid ww-metric-grid-three">
        <MetricCard detail="Holdout across 400 unseen batches" icon="⌁" label="Simulated margin R²" value={modelMetrics.discount.r2.toFixed(3)} />
        <MetricCard detail="Matched the best simulated option" icon="✓" label="Best-discount match rate" tone="green" value={`${(modelMetrics.discount.bestDiscountMatchRate * 100).toFixed(1)}%`} />
        <MetricCard detail="Mean regret vs best simulated option" icon="!" label="Simulated regret" tone="amber" value={modelMetrics.discount.meanSimulatedRegret.toFixed(3)} />
      </div>
      <Panel
        className="ww-table-panel"
        subtitle="Batch #5001 · Tomatoes 1kg · 72 remaining · 5 days to expiry"
        title="Scenario comparison"
      >
        <div className="ww-scenario-highlight">
          <div className="ww-scenario-icon">✳</div>
          <div><span>Highest simulated margin in this example</span><strong>{bestScenario.discount}% discount · {formatCurrency(bestScenario.margin)}</strong></div>
          <StatusPill tone="amber">Simulation only</StatusPill>
        </div>
        <TableFrame>
          <table>
            <thead><tr><th>Discount</th><th>Simulated units sold</th><th>Simulated revenue</th><th>Simulated gross margin</th><th>Scenario</th></tr></thead>
            <tbody>{scenarioOutcomes.map((scenario) => (
              <tr key={scenario.discount}>
                <td><strong>{scenario.discount}%</strong></td><td>{scenario.units}</td>
                <td>{formatCurrency(scenario.revenue)}</td><td>{formatCurrency(scenario.margin)}</td>
                <td>{scenario.discount === bestScenario.discount ? <StatusPill tone="green">Top in simulator</StatusPill> : <span className="ww-muted">Illustrative</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </TableFrame>
        <div className="ww-table-footer">Observed simulated scenario outcomes from discount_scenarios_simulated.csv; not real sales or model predictions for an active store.</div>
      </Panel>
      <DataNotice>
        The model was evaluated with batches held out by batch ID. Its MAE is {formatCurrency(modelMetrics.discount.mae)} on simulated gross margin. Validate with real experiments before making pricing decisions.
      </DataNotice>
    </>
  );
}

export function WasteReportsPage() {
  const totalWaste = wasteByCategory.reduce((sum, category) => sum + category.waste, 0);
  const totalSales = wasteByCategory.reduce((sum, category) => sum + category.sales, 0);

  return (
    <>
      <PageHeading
        eyebrow="WASTE ANALYTICS"
        title="Food waste reports"
        description="Review the supplied historical waste totals and what the next-day prediction experiment can—and cannot—tell us."
        action={<Link className="ww-button ww-button-secondary" to="/models">Waste model details <span aria-hidden="true">→</span></Link>}
      />
      <div className="ww-metric-grid ww-metric-grid-three">
        <MetricCard detail="Source period · 1 Apr–27 Sep 2026" icon="↘" label="Recorded waste" tone="amber" value={`${formatNumber(totalWaste)} units`} />
        <MetricCard detail="Across the same historical records" icon="↗" label="Units sold" value={formatNumber(totalSales)} />
        <MetricCard detail="Sparse targets · zero baseline same MAE" icon="!" label="Waste model R²" tone="rose" value={modelMetrics.waste.r2.toFixed(3)} />
      </div>
      <div className="ww-dashboard-grid ww-waste-grid">
        <Panel subtitle="Sum of waste_units by category in perishable_inventory copy.csv." title="Recorded waste by category">
          <CategoryBars
            formatter={(value) => `${formatNumber(value)} units`}
            measure="waste units"
            values={wasteByCategory.map(({ name, waste, color }) => ({ name, count: waste, color }))}
          />
        </Panel>
        <Panel subtitle="Historical sold units by category in the same source." title="Sales by category">
          <CategoryBars
            formatter={(value) => `${formatNumber(value)} units`}
            measure="sold units"
            values={wasteByCategory.map(({ name, sales, color }) => ({ name, count: sales, color }))}
          />
        </Panel>
      </div>
      <Panel className="ww-table-panel" subtitle="Observed totals across the full available history." title="Category summary">
        <TableFrame>
          <table>
            <thead><tr><th>Category</th><th>Units sold</th><th>Recorded waste</th><th>Waste share of recorded units</th></tr></thead>
            <tbody>{wasteByCategory.map((category) => (
              <tr key={category.name}>
                <td><strong>{category.name}</strong></td><td>{formatNumber(category.sales)}</td><td>{formatNumber(category.waste)}</td>
                <td>{((category.waste / (category.sales + category.waste)) * 100).toFixed(1)}%</td>
              </tr>
            ))}</tbody>
          </table>
        </TableFrame>
      </Panel>
      <div className="ww-model-caveat">
        <span className="ww-caveat-mark">!</span>
        <div><strong>Waste predictions are not reliable yet</strong><p>The chronological holdout has R² {modelMetrics.waste.r2.toFixed(3)} and only {(modelMetrics.waste.nonzeroRate * 100).toFixed(1)}% non-zero test targets. The selected median baseline ties the zero-waste baseline on MAE. Treat this as a data-quality finding, not a useful operational forecast.</p></div>
      </div>
    </>
  );
}

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesText = !query || `${product.name} ${product.category} ${product.id}`.toLowerCase().includes(query);
      return matchesText && (category === "All categories" || product.category === category);
    });
  }, [category, search]);
  const exportRows = products.map((product) => ({
    product_id: product.id,
    product_name: product.name,
    category: product.category,
    unit_price: product.price,
    unit_cost: product.cost,
    batch_count: product.batches,
    flagged_batch_count: product.flaggedBatches,
    on_hand_units: product.onHandUnits,
    historical_sales_units: product.salesUnits,
    recorded_waste_units: product.wasteUnits,
  }));

  return (
    <>
      <PageHeading
        eyebrow="PRODUCT CATALOG"
        title="Products"
        description="The ten products in the local project dataset, with historical batch, sales, and waste totals."
        action={<ExportButton filename="wastewise-products-sample.csv" rows={exportRows} />}
      />
      <DataNotice>Products and totals are aggregated from the bundled products, inventory batches, and perishable inventory CSVs; this is not an up-to-date catalog.</DataNotice>
      <Panel className="ww-table-panel" subtitle={`${visibleProducts.length} products · sample catalogue`} title="Product catalog">
        <SearchAndCategory category={category} onCategory={setCategory} onSearch={setSearch} search={search} searchLabel="Search products" />
        {visibleProducts.length > 0 ? (
          <TableFrame>
            <table>
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Unit cost</th><th>Batch count</th><th>Units on hand</th><th>Historical sales</th><th>Recorded waste</th></tr></thead>
              <tbody>{visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong><span className="ww-cell-subtitle">ID {product.id} · {product.shelfLifeDays}-day shelf life</span></td>
                  <td>{product.category}</td><td>{formatCurrency(product.price)}</td><td>{formatCurrency(product.cost)}</td>
                  <td>{formatNumber(product.batches)}</td><td>{formatNumber(product.onHandUnits)}</td><td>{formatNumber(product.salesUnits)}</td><td>{formatNumber(product.wasteUnits)}</td>
                </tr>
              ))}</tbody>
            </table>
          </TableFrame>
        ) : <EmptyState title="No products match">Try another search or category.</EmptyState>}
      </Panel>
    </>
  );
}

export function SalesHistoryPage() {
  const totalSales = products.reduce((sum, product) => sum + product.salesUnits, 0);
  const totalWaste = products.reduce((sum, product) => sum + product.wasteUnits, 0);

  return (
    <>
      <PageHeading
        eyebrow="HISTORICAL SALES"
        title="Sales history"
        description="Browse the observed daily sales values available in the bundled perishable inventory dataset."
        action={<Link className="ww-button ww-button-secondary" to="/forecasts">Open forecast <span aria-hidden="true">→</span></Link>}
      />
      <div className="ww-metric-grid ww-metric-grid-three">
        <MetricCard detail="1 Apr–27 Sep 2026 · bundled CSV" icon="↗" label="Units sold" value={formatNumber(totalSales)} />
        <MetricCard detail="Six months of daily product records" icon="▤" label="Daily records" tone="blue" value="1,800" />
        <MetricCard detail="Observed waste in same source" icon="↘" label="Waste units" tone="amber" value={formatNumber(totalWaste)} />
      </div>
      <Panel subtitle="Recorded aggregate units sold per day · 21–27 Sep 2026." title="Recent daily sales">
        <Bars
          color="green"
          label="Historical daily sales from September 21 to 27, 2026"
          values={recentSales.map((day) => ({
            label: new Date(`${day.date}T12:00:00`).toLocaleDateString("en", { weekday: "short" }),
            value: day.sales,
          }))}
        />
        <div className="ww-chart-footnote"><span><i className="ww-legend-dot ww-legend-green" /> Actual recorded units sold</span><span>Source: perishable_inventory copy.csv</span></div>
      </Panel>
      <Panel className="ww-table-panel" subtitle="The final seven available dates in the source file." title="Daily sales and waste">
        <TableFrame>
          <table>
            <thead><tr><th>Date</th><th>Weekday</th><th>Units sold</th><th>Waste units</th></tr></thead>
            <tbody>{recentSales.map((day) => (
              <tr key={day.date}>
                <td>{day.date}</td>
                <td>{new Date(`${day.date}T12:00:00`).toLocaleDateString("en", { weekday: "long" })}</td>
                <td><strong>{day.sales}</strong></td>
                <td>{day.waste > 0 ? day.waste : <span className="ww-muted">0</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </TableFrame>
      </Panel>
    </>
  );
}

const modelRows = [
  { name: "Demand forecast", task: "Next-day units sold", source: "Perishable inventory · 1,520 rows", split: "Chronological · 310 test rows", score: "MAE 3.85 · R² 0.722", status: "Useful signal", tone: "green" as const },
  { name: "Expiry risk", task: "Batch risk classification", source: "Inventory batches · 2,000 rows", split: "Chronological · 135 test rows", score: "F1 0.885 · ROC-AUC 0.940", status: "Promising prototype", tone: "blue" as const },
  { name: "Food waste", task: "Next-day waste units", source: "Perishable inventory · 1,790 rows", split: "Chronological · 360 test rows", score: "MAE 1.67 · R² −0.060", status: "Weak · baseline selected", tone: "rose" as const },
  { name: "Discount scenario", task: "Simulated gross margin", source: "Simulated scenarios · 10,000 rows", split: "Grouped by batch · 2,000 test rows", score: "MAE 33.98 · R² 0.954", status: "Simulation only", tone: "amber" as const },
];

export function ModelMetricsPage() {
  return (
    <>
      <PageHeading
        eyebrow="MODEL MONITORING"
        title="Model performance"
        description="Holdout results from the saved artifacts. Chronological or grouped splits are reported as configured for each task."
        action={<Link className="ww-button ww-button-secondary" to="/forecasts">View forecasts <span aria-hidden="true">→</span></Link>}
      />
      <DataNotice>
        These are offline evaluations, not live monitoring. Every result uses a held-out set; details, dates, and limits are shown below.
      </DataNotice>
      <Panel className="ww-table-panel" subtitle="Scores are from each model's held-out test data, not training data." title="Validation overview">
        <TableFrame>
          <table>
            <thead><tr><th>Model</th><th>Task</th><th>Dataset / split</th><th>Holdout score</th><th>Interpretation</th></tr></thead>
            <tbody>{modelRows.map((model) => (
              <tr key={model.name}>
                <td><strong>{model.name}</strong></td><td>{model.task}</td>
                <td><span>{model.source}</span><span className="ww-cell-subtitle">{model.split}</span></td>
                <td><strong>{model.score}</strong></td><td><StatusPill tone={model.tone}>{model.status}</StatusPill></td>
              </tr>
            ))}</tbody>
          </table>
        </TableFrame>
      </Panel>
      <div className="ww-dashboard-grid ww-model-detail-grid">
        <Panel subtitle="Train: 29 Apr–27 Aug · test: 28 Aug–27 Sep 2026." title="Demand forecast">
          <div className="ww-score-grid">
            <div><span>MAE</span><strong>{modelMetrics.demand.mae.toFixed(2)}</strong></div>
            <div><span>RMSE</span><strong>{modelMetrics.demand.rmse.toFixed(2)}</strong></div>
            <div><span>R²</span><strong>{modelMetrics.demand.r2.toFixed(3)}</strong></div>
          </div>
          <p className="ww-panel-note">Lag-1 baseline MAE: {modelMetrics.demand.baselineMae.toFixed(2)}. Validation data was split chronologically.</p>
        </Panel>
        <Panel subtitle="Train through 6 Oct · test: 7 Oct–3 Nov 2026." title="Expiry risk">
          <div className="ww-score-grid">
            <div><span>Accuracy</span><strong>{(modelMetrics.expiry.accuracy * 100).toFixed(1)}%</strong></div>
            <div><span>F1</span><strong>{modelMetrics.expiry.f1.toFixed(3)}</strong></div>
            <div><span>ROC-AUC</span><strong>{modelMetrics.expiry.rocAuc.toFixed(3)}</strong></div>
          </div>
          <p className="ww-panel-note">Balanced accuracy: {modelMetrics.expiry.balancedAccuracy.toFixed(3)}. Expiry-risk and simulated waste outcomes were excluded from input features.</p>
        </Panel>
        <Panel subtitle="Train through 22 Aug · test: 23 Aug–27 Sep 2026." title="Food waste">
          <div className="ww-score-grid">
            <div><span>MAE</span><strong>{modelMetrics.waste.mae.toFixed(2)}</strong></div>
            <div><span>RMSE</span><strong>{modelMetrics.waste.rmse.toFixed(2)}</strong></div>
            <div><span>R²</span><strong className="ww-negative-score">{modelMetrics.waste.r2.toFixed(3)}</strong></div>
          </div>
          <p className="ww-panel-note">Median/zero baseline selected; test targets are only {(modelMetrics.waste.nonzeroRate * 100).toFixed(1)}% non-zero. This is not a reliable operational signal.</p>
        </Panel>
        <Panel subtitle="Grouped by batch ID · 400 batches / 2,000 scenario rows held out." title="Discount scenario">
          <div className="ww-score-grid">
            <div><span>MAE</span><strong>{formatCurrency(modelMetrics.discount.mae)}</strong></div>
            <div><span>RMSE</span><strong>{formatCurrency(modelMetrics.discount.rmse)}</strong></div>
            <div><span>R²</span><strong>{modelMetrics.discount.r2.toFixed(3)}</strong></div>
          </div>
          <p className="ww-panel-note">Prototype only: scenario outcomes are simulated and do not establish real customer price response.</p>
        </Panel>
      </div>
      <DataNotice>
        Artifact metadata: demand forecasting uses 1,520 rows after chronological feature construction; expiry risk uses 2,000 batches with the target excluded; food waste predicts the next day using only inputs available beforehand; discount scenarios are synthetic.
      </DataNotice>
    </>
  );
}

export function NotFoundPage() {
  return (
    <div className="ww-not-found">
      <span>404</span>
      <h1>That page isn't in this workspace.</h1>
      <p>Use the navigation to explore the WasteWise demo pages.</p>
      <Link className="ww-button ww-button-primary" to="/dashboard">Back to dashboard <span aria-hidden="true">→</span></Link>
    </div>
  );
}
