import type { ReactNode } from "react";

type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeading({
  eyebrow = "WASTEWISE AI",
  title,
  description,
  action,
}: PageHeadingProps) {
  return (
    <div className="ww-page-heading">
      <div>
        <div className="ww-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="ww-heading-action">{action}</div> : null}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "green" | "amber" | "blue" | "rose";
  icon: string;
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "green",
  icon,
}: MetricCardProps) {
  return (
    <article className="ww-metric-card">
      <div className={`ww-metric-icon ww-tone-${tone}`} aria-hidden="true">
        {icon}
      </div>
      <span className="ww-metric-label">{label}</span>
      <strong>{value}</strong>
      <span className="ww-metric-detail">{detail}</span>
    </article>
  );
}

type PanelProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: PanelProps) {
  return (
    <section className={`ww-panel ${className}`}>
      <div className="ww-panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div className="ww-panel-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function DataNotice({ children }: { children: ReactNode }) {
  return (
    <div className="ww-notice">
      <span className="ww-notice-icon" aria-hidden="true">
        i
      </span>
      <p>{children}</p>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "rose" | "blue" | "neutral";
}) {
  return <span className={`ww-pill ww-pill-${tone}`}>{children}</span>;
}

export function Bars({
  values,
  label,
  valueLabel = (value) => value.toLocaleString(),
  color = "green",
}: {
  values: { label: string; value: number }[];
  label: string;
  valueLabel?: (value: number) => string;
  color?: "green" | "amber" | "blue";
}) {
  const maximum = Math.max(...values.map((entry) => entry.value), 1);

  return (
    <div className={`ww-bars ww-bars-${color}`} role="img" aria-label={label}>
      {values.map((entry) => (
        <div className="ww-bar-column" key={entry.label}>
          <span className="ww-bar-value">{valueLabel(entry.value)}</span>
          <div className="ww-bar-track">
            <div
              className="ww-bar"
              style={{ height: `${Math.max((entry.value / maximum) * 100, 3)}%` }}
            />
          </div>
          <span className="ww-bar-label">{entry.label}</span>
        </div>
      ))}
    </div>
  );
}

export function CategoryBars({
  values,
  measure,
  formatter = (value) => value.toLocaleString(),
}: {
  values: { name: string; count: number; color?: string }[];
  measure: string;
  formatter?: (value: number) => string;
}) {
  const maximum = Math.max(...values.map((entry) => entry.count), 1);

  return (
    <div className="ww-category-bars">
      {values.map((entry) => (
        <div className="ww-category-row" key={entry.name}>
          <div className="ww-category-label">
            <span className="ww-category-dot" style={{ background: entry.color }} />
            <span>{entry.name}</span>
            <strong>{formatter(entry.count)}</strong>
          </div>
          <div
            className="ww-category-track"
            role="img"
            aria-label={`${entry.name}: ${formatter(entry.count)} ${measure}`}
          >
            <div
              className="ww-category-fill"
              style={{
                width: `${Math.max((entry.count / maximum) * 100, 2)}%`,
                background: entry.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableFrame({ children }: { children: ReactNode }) {
  return <div className="ww-table-wrap">{children}</div>;
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="ww-empty-state">
      <span aria-hidden="true">⌕</span>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function ExportButton({
  filename,
  rows,
}: {
  filename: string;
  rows: Record<string, string | number | boolean>[];
}) {
  const exportCsv = () => {
    if (rows.length === 0) return;

    const columns = Object.keys(rows[0]);
    const csvCell = (value: string | number | boolean) =>
      `"${String(value).replaceAll('"', '""')}"`;
    const contents = [
      columns.map(csvCell).join(","),
      ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([contents], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="ww-button ww-button-secondary" onClick={exportCsv} type="button">
      <span aria-hidden="true">↓</span>
      Export CSV
    </button>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="ww-search-field">
      <span aria-hidden="true">⌕</span>
      <input
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
