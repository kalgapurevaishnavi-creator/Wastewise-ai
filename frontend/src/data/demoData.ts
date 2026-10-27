export type Product = {
  id: string;
  name: string;
  category: string;
  shelfLifeDays: number;
  price: number;
  cost: number;
  batches: number;
  flaggedBatches: number;
  onHandUnits: number;
  salesUnits: number;
  wasteUnits: number;
  averageDaysToExpiry: number;
};

export type InventoryBatch = {
  id: string;
  product: string;
  category: string;
  snapshotDate: string;
  expiryDate: string;
  quantity: number;
  daysToExpiry: number;
  averageDailySales: number;
  discountPercent: number;
  risk: boolean;
};

export const products: Product[] = [
  { id: "1001", name: "Milk 500ml", category: "Dairy", shelfLifeDays: 5, price: 32, cost: 24, batches: 218, flaggedBatches: 165, onHandUnits: 15909, salesUnits: 1868, wasteUnits: 313, averageDaysToExpiry: 1.6 },
  { id: "1002", name: "Yogurt Cup", category: "Dairy", shelfLifeDays: 10, price: 25, cost: 17, batches: 195, flaggedBatches: 80, onHandUnits: 7306, salesUnits: 5408, wasteUnits: 311, averageDaysToExpiry: 4.1 },
  { id: "1003", name: "Bread Loaf", category: "Bakery", shelfLifeDays: 4, price: 40, cost: 26, batches: 196, flaggedBatches: 145, onHandUnits: 12072, salesUnits: 4672, wasteUnits: 195, averageDaysToExpiry: 0.9 },
  { id: "1004", name: "Paneer 200g", category: "Dairy", shelfLifeDays: 7, price: 85, cost: 62, batches: 178, flaggedBatches: 104, onHandUnits: 9404, salesUnits: 3535, wasteUnits: 275, averageDaysToExpiry: 2.6 },
  { id: "1005", name: "Spinach Pack", category: "Produce", shelfLifeDays: 3, price: 30, cost: 18, batches: 209, flaggedBatches: 159, onHandUnits: 14565, salesUnits: 3525, wasteUnits: 383, averageDaysToExpiry: 0.6 },
  { id: "1006", name: "Tomatoes 1kg", category: "Produce", shelfLifeDays: 7, price: 45, cost: 28, batches: 200, flaggedBatches: 97, onHandUnits: 8267, salesUnits: 6001, wasteUnits: 189, averageDaysToExpiry: 2.6 },
  { id: "1007", name: "Apple 1kg", category: "Produce", shelfLifeDays: 14, price: 120, cost: 78, batches: 199, flaggedBatches: 112, onHandUnits: 9728, salesUnits: 1902, wasteUnits: 238, averageDaysToExpiry: 6.0 },
  { id: "1008", name: "Orange Juice 1L", category: "Beverage", shelfLifeDays: 30, price: 95, cost: 61, batches: 203, flaggedBatches: 33, onHandUnits: 3372, salesUnits: 5015, wasteUnits: 277, averageDaysToExpiry: 13.2 },
  { id: "1009", name: "Fresh Cream", category: "Dairy", shelfLifeDays: 8, price: 60, cost: 41, batches: 199, flaggedBatches: 138, onHandUnits: 11818, salesUnits: 2428, wasteUnits: 157, averageDaysToExpiry: 3.0 },
  { id: "1010", name: "Muffin Pack", category: "Bakery", shelfLifeDays: 5, price: 55, cost: 34, batches: 203, flaggedBatches: 139, onHandUnits: 13115, salesUnits: 1913, wasteUnits: 264, averageDaysToExpiry: 1.4 },
];

export const inventoryBatches: InventoryBatch[] = [
  { id: "5003", product: "Milk 500ml", category: "Dairy", snapshotDate: "2026-08-20", expiryDate: "2026-08-23", quantity: 3, daysToExpiry: 3, averageDailySales: 12.67, discountPercent: 10, risk: true },
  { id: "5027", product: "Yogurt Cup", category: "Dairy", snapshotDate: "2026-09-30", expiryDate: "2026-09-28", quantity: 120, daysToExpiry: -2, averageDailySales: 23.53, discountPercent: 20, risk: true },
  { id: "5004", product: "Bread Loaf", category: "Bakery", snapshotDate: "2026-08-26", expiryDate: "2026-08-25", quantity: 141, daysToExpiry: -1, averageDailySales: 14.52, discountPercent: 10, risk: true },
  { id: "5013", product: "Paneer 200g", category: "Dairy", snapshotDate: "2026-08-06", expiryDate: "2026-08-06", quantity: 132, daysToExpiry: 0, averageDailySales: 18.26, discountPercent: 0, risk: true },
  { id: "5011", product: "Spinach Pack", category: "Produce", snapshotDate: "2026-08-09", expiryDate: "2026-08-08", quantity: 15, daysToExpiry: -1, averageDailySales: 24.31, discountPercent: 15, risk: false },
  { id: "5001", product: "Tomatoes 1kg", category: "Produce", snapshotDate: "2026-08-16", expiryDate: "2026-08-21", quantity: 72, daysToExpiry: 5, averageDailySales: 23.38, discountPercent: 5, risk: true },
  { id: "5005", product: "Apple 1kg", category: "Produce", snapshotDate: "2026-07-19", expiryDate: "2026-07-30", quantity: 52, daysToExpiry: 11, averageDailySales: 13.09, discountPercent: 20, risk: true },
  { id: "5006", product: "Orange Juice 1L", category: "Beverage", snapshotDate: "2026-09-07", expiryDate: "2026-09-08", quantity: 36, daysToExpiry: 1, averageDailySales: 36.04, discountPercent: 5, risk: false },
  { id: "5025", product: "Fresh Cream", category: "Dairy", snapshotDate: "2026-09-18", expiryDate: "2026-09-26", quantity: 80, daysToExpiry: 8, averageDailySales: 9.66, discountPercent: 15, risk: true },
  { id: "5007", product: "Muffin Pack", category: "Bakery", snapshotDate: "2026-07-21", expiryDate: "2026-07-22", quantity: 73, daysToExpiry: 1, averageDailySales: 9.34, discountPercent: 0, risk: true },
];

export const recentSales = [
  { date: "2026-09-21", sales: 191, waste: 24 },
  { date: "2026-09-22", sales: 162, waste: 23 },
  { date: "2026-09-23", sales: 160, waste: 25 },
  { date: "2026-09-24", sales: 169, waste: 0 },
  { date: "2026-09-25", sales: 190, waste: 80 },
  { date: "2026-09-26", sales: 209, waste: 0 },
  { date: "2026-09-27", sales: 224, waste: 0 },
];

export const demandProjection = [
  { date: "2026-09-28", forecast: 176.1 },
  { date: "2026-09-29", forecast: 178.3 },
  { date: "2026-09-30", forecast: 173.9 },
  { date: "2026-10-01", forecast: 175.2 },
  { date: "2026-10-02", forecast: 176.7 },
  { date: "2026-10-03", forecast: 217.0 },
  { date: "2026-10-04", forecast: 216.6 },
];

export const wasteByCategory = [
  { name: "Dairy", sales: 13239, waste: 1056, color: "#628364" },
  { name: "Produce", sales: 11428, waste: 810, color: "#8ca573" },
  { name: "Bakery", sales: 6585, waste: 459, color: "#c2a56e" },
  { name: "Beverage", sales: 5015, waste: 277, color: "#92a7a0" },
];

export const modelMetrics = {
  demand: { mae: 3.8514, rmse: 4.9573, r2: 0.7219, baselineMae: 5.3613, trainedRows: 1520, testRows: 310 },
  expiry: { accuracy: 0.8593, balancedAccuracy: 0.8508, f1: 0.8848, rocAuc: 0.9399, trainedRows: 2000, testRows: 135 },
  waste: { mae: 1.6667, rmse: 7.0222, r2: -0.0597, medianMae: 1.6667, nonzeroRate: 0.075, trainedRows: 1790, testRows: 360 },
  discount: { mae: 33.9761, rmse: 87.7545, r2: 0.9541, bestDiscountMatchRate: 0.8075, meanSimulatedRegret: 0.1775, trainedRows: 10000, testRows: 2000 },
};

export const dataNotes = {
  salesStart: "2026-04-01",
  salesEnd: "2026-09-27",
  batchStart: "2026-07-01",
  batchEnd: "2026-11-03",
  totalBatches: 2000,
  flaggedBatches: 1172,
  totalOnHand: 105556,
  totalSold: 36267,
  totalWaste: 2602,
  simulatedBatchWaste: 48989,
  discountScenariosPerBatch: 5,
};

export const categories = ["All categories", "Dairy", "Produce", "Bakery", "Beverage"];
