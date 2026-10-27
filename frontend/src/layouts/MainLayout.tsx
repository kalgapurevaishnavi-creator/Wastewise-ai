import { useState, type FormEvent } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

const navigation = [
  {
    heading: "OVERVIEW",
    links: [{ label: "Dashboard", to: "/dashboard", icon: "grid" }],
  },
  {
    heading: "INVENTORY",
    links: [
      { label: "Inventory", to: "/inventory", icon: "box" },
      { label: "Expiry risk", to: "/expiry-risk", icon: "clock" },
      { label: "Products", to: "/products", icon: "leaf" },
    ],
  },
  {
    heading: "INSIGHTS",
    links: [
      { label: "Demand forecast", to: "/forecasts", icon: "chart" },
      { label: "Recommendations", to: "/recommendations", icon: "spark" },
      { label: "Waste reports", to: "/waste", icon: "report" },
      { label: "Sales history", to: "/sales", icon: "sales" },
    ],
  },
  {
    heading: "SYSTEM",
    links: [{ label: "Model performance", to: "/models", icon: "settings" }],
  },
];

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    box: "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm-8 4.5 8 4.5 8-4.5M12 12v9",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2",
    leaf: "M20 4c-9 0-15 3.5-15 10a6 6 0 0 0 6 6c6.5 0 9-7 9-16ZM5 20c2-5 6-8 11-11",
    chart: "M4 19V5m0 14h17M8 15l4-5 3 2 5-7",
    spark: "m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z",
    report: "M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7",
    sales: "M4 18V6m0 12h16M8 15v-4m4 4V7m4 8v-6",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4",
  };

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d={paths[name] ?? paths.grid}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  return (
    <>
      {open ? (
        <button
          aria-label="Close navigation"
          className="ww-sidebar-scrim"
          onClick={onNavigate}
          type="button"
        />
      ) : null}
      <aside className={`ww-sidebar${open ? " ww-sidebar-open" : ""}`}>
        <NavLink aria-label="WasteWise AI dashboard" className="ww-brand" onClick={onNavigate} to="/dashboard">
          <span className="ww-brand-mark" aria-hidden="true">
            <NavIcon name="leaf" />
          </span>
          <span>
            <strong>WasteWise</strong>
            <small>AI · FOOD INTELLIGENCE</small>
          </span>
        </NavLink>

        <div className="ww-nav-sections">
          {navigation.map((section) => (
            <div className="ww-nav-section" key={section.heading}>
              <span className="ww-nav-heading">{section.heading}</span>
              {section.links.map((link) => (
                <NavLink
                  className={({ isActive }) =>
                    `ww-nav-link${isActive ? " ww-nav-link-active" : ""}`
                  }
                  key={link.to}
                  onClick={onNavigate}
                  to={link.to}
                >
                  <NavIcon name={link.icon} />
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="ww-sidebar-bottom">
          <div className="ww-help-card">
            <div className="ww-help-icon" aria-hidden="true">?</div>
            <strong>New to WasteWise?</strong>
            <span>Explore the project overview.</span>
            <NavLink onClick={onNavigate} to="/about">About this project <span aria-hidden="true">↗</span></NavLink>
          </div>
          <div className="ww-user-row">
            <div className="ww-avatar">WW</div>
            <div>
              <strong>Demo workspace</strong>
              <span>Local project data</span>
            </div>
            <span className="ww-user-dots" aria-hidden="true">···</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/inventory?search=${encodeURIComponent(query)}` : "/inventory");
    setSidebarOpen(false);
  };

  return (
    <div className="ww-app">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="ww-main">
        <header className="ww-topbar">
          <button
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            className="ww-menu-toggle"
            onClick={() => setSidebarOpen((value) => !value)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          <form className="ww-top-search" onSubmit={submitSearch} role="search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search inventory by name or ID"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search inventory..."
              type="search"
              value={search}
            />
            <button aria-label="Search inventory" className="ww-top-search-submit" type="submit">
              ↵
            </button>
          </form>
          <div className="ww-topbar-right">
            <span className="ww-local-indicator"><span /> Demo data</span>
            <NavLink aria-label="View expiry risk alerts" className="ww-alert-link" to="/expiry-risk">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
              </svg>
            </NavLink>
            <div className="ww-top-avatar">WW</div>
          </div>
        </header>

        <div className="ww-data-banner">
          <span className="ww-data-dot" />
          <span>
            Preview only — bundled CSV data, not connected to the live database or API.
          </span>
          <NavLink to="/about">About this demo <span aria-hidden="true">↗</span></NavLink>
        </div>

        <main className="ww-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}