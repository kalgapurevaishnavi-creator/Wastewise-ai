import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./dashboard.css";
import "./landing.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Could not find the application root element "#root".');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);