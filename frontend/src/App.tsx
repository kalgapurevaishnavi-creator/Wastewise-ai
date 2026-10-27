import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Landing from "./pages/Landing";
import {
  DashboardPage,
  DemandForecastPage,
  ExpiryRiskPage,
  InventoryPage,
  ModelMetricsPage,
  NotFoundPage,
  ProductsPage,
  RecommendationsPage,
  SalesHistoryPage,
  WasteReportsPage,
} from "./pages/WorkspacePages";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Landing />} path="/" />
        <Route element={<Landing />} path="/about" />
        <Route element={<MainLayout />}>
          <Route element={<DashboardPage />} path="dashboard" />
          <Route element={<InventoryPage />} path="inventory" />
          <Route element={<DemandForecastPage />} path="forecasts" />
          <Route element={<ExpiryRiskPage />} path="expiry-risk" />
          <Route element={<RecommendationsPage />} path="recommendations" />
          <Route element={<WasteReportsPage />} path="waste" />
          <Route element={<ProductsPage />} path="products" />
          <Route element={<SalesHistoryPage />} path="sales" />
          <Route element={<ModelMetricsPage />} path="models" />
          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
