import { useState } from "react";
import { recentSales } from "../data/demoData";

function LeafIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 36 36"
    >
      <path
        d="M28.9 6.7C17.3 6.4 8.1 10 8.1 19.6c0 4.8 3.1 7.9 7.4 7.9 9.4 0 13.7-9.2 13.4-20.8Z"
        fill="currentColor"
      />
      <path
        d="M8.8 30.2c3.7-7.4 9-12 16.6-16.3"
        stroke="#f7f8f1"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      {diagonal ? (
        <path
          d="M5.7 14.3 14.3 5.7M6.7 5.7h7.6v7.6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      ) : (
        <path
          d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      )}
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 2.5 14.1 9l6.4-2.1-2.1 6.4 6.1 2.2-6.3 2-2.2 6.5-2-6.4-6.5 2 2.2-6.2-6.4-2.3 6.3-2L12 2.5Z"
        fill="currentColor"
        transform="translate(-2 -2)"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m6.7 10.2 2.1 2.1 4.7-4.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function DashboardPreview() {
  const maximumSales = Math.max(...recentSales.map((day) => day.sales));

  return (
    <section
      aria-labelledby="dashboard-heading"
      className="dashboard-section"
      id="dashboard"
    >
      <div className="dashboard-heading">
        <div>
          <span className="section-eyebrow">A CLEARER VIEW OF YOUR STORE</span>
          <h2 id="dashboard-heading">
            Less guesswork.
            <br />
            <em>More good food.</em>
          </h2>
        </div>
        <p>
          A simple snapshot of the insights WasteWise brings together to help
          you plan what comes next.
        </p>
      </div>

      <div className="dashboard-window">
        <div className="dashboard-topbar">
          <div className="dashboard-window-brand">
            <span className="window-brand-icon">
              <LeafIcon />
            </span>
            <span>
              <strong>WasteWise</strong>
              <small>INVENTORY INTELLIGENCE</small>
            </span>
          </div>
          <span className="dashboard-window-period">
            ILLUSTRATIVE PREVIEW <span>·</span> PROJECT DATA
          </span>
        </div>

        <div className="dashboard-body">
          <div className="dashboard-welcome">
            <span className="dashboard-online">
              <span />
              YOUR FOOD, IN FOCUS
            </span>
            <h3>Good morning, let’s make today count.</h3>
            <p>
              Here’s what your fresh inventory is telling us. A little insight
              can make a lot of difference.
            </p>
          </div>

          <div className="dashboard-cards">
            <article className="metric-card">
              <div className="metric-icon metric-icon--green">
                <LeafIcon />
              </div>
              <span className="metric-card-label">INVENTORY BATCHES</span>
              <strong>2,000</strong>
              <span className="metric-card-foot">across your fresh range</span>
            </article>

            <article className="metric-card">
              <div className="metric-icon metric-icon--amber">
                <SparkIcon />
              </div>
              <span className="metric-card-label">WORTH A CLOSER LOOK</span>
              <strong>1,172</strong>
              <span className="metric-card-foot">batches labelled at risk in the sample</span>
            </article>

            <article className="metric-card metric-card--chart">
              <div className="chart-card-heading">
                <span className="metric-card-label">RECORDED SALES</span>
                <span className="chart-trend">SOURCE WEEK</span>
              </div>
              <strong>224 units <span>on 27 Sep</span></strong>
              <div aria-label="Recorded daily sales from September 21 to 27, 2026" className="bar-chart" role="img">
                {recentSales.map((item) => (
                  <div aria-label={`${item.date}: ${item.sales} units sold`} className="bar-group" key={item.date}>
                    <div className="bar-pair">
                      <span className="bar bar--actual" style={{ height: `${(item.sales / maximumSales) * 100}%` }} />
                    </div>
                    <span className="bar-day">{new Date(`${item.date}T12:00:00`).toLocaleDateString("en", { weekday: "short" }).slice(0, 1)}</span>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span><i className="legend-swatch legend-swatch--actual" /> Recorded sales</span>
                <span>Sample · 21–27 Sep 2026</span>
              </div>
            </article>
          </div>

          <div className="dashboard-bottom-note">
            <span><CheckIcon /> Your next decision, with a little more clarity.</span>
            <span>MODEL-POWERED INSIGHTS &nbsp; · &nbsp; FRESHNESS FIRST</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <a aria-label="WasteWise AI home" className="landing-brand" href="#home">
          <span className="landing-brand-icon"><LeafIcon /></span>
          <span className="landing-wordmark">
            WasteWise <span>AI</span>
            <small>FRESH THINKING, LESS WASTE</small>
          </span>
        </a>

        <nav aria-label="Main navigation" className="landing-nav">
          <a href="#approach">Our approach</a>
          <a href="#project-data">Project data</a>
        </nav>

        <a className="header-dashboard-link" href="/dashboard">
          <span>Open dashboard</span>
          <ArrowIcon diagonal />
        </a>
      </header>

      <main id="home">
        <section aria-labelledby="hero-heading" className="hero-section" id="approach">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <span className="eyebrow-line" />
              FOOD INVENTORY INTELLIGENCE
            </div>

            <h1 id="hero-heading">
              <span className="hero-heading-line">
                Make every<span className="hero-desktop-word"> fresh</span>
              </span>
              <span className="hero-heading-line">
                <span className="hero-mobile-word">fresh </span>
                ingredient <span className="hero-heading-accent">count.</span>
              </span>
            </h1>

            <p className="hero-description">
              WasteWise AI brings inventory signals, expiry-risk estimates,
              and demand context together to help teams make more thoughtful
              food decisions.
            </p>

            <div className="hero-actions">
              <a className="primary-action" href="/dashboard">
                Explore the dashboard
                <ArrowIcon />
              </a>
              <a className="secondary-action" href="#project-data">
                See how it works
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className="hero-values">
              <span><CheckIcon /> Safety-first guidance</span>
              <span><SparkIcon /> Model-informed insights</span>
            </div>
          </div>

          <div className={`hero-visual${imageLoaded ? " hero-visual--loaded" : ""}`}>
            <div aria-hidden="true" className="image-caption">
              <span>FRESH FOOD, THOUGHTFULLY MANAGED</span>
              <span>01 — 04</span>
            </div>
            <img
              alt="Colorful fresh vegetables arranged in a grocery market display"
              className="market-image"
              fetchPriority="high"
              onLoad={() => setImageLoaded(true)}
              src="/images/fresh-produce-market.jpg"
            />
            <div className="image-vignette" />
            <div className="freshness-card">
              <div className="freshness-icon"><LeafIcon /></div>
              <span>
                <strong>Freshness has a window.</strong>
                <small>Make the most of every day.</small>
              </span>
              <span aria-hidden="true" className="freshness-arrow"><ArrowIcon diagonal /></span>
            </div>
            <span aria-hidden="true" className="image-index">GROWN WITH CARE · SAVED WITH INSIGHT</span>
          </div>
        </section>

        <section aria-label="WasteWise project highlights" className="highlights" id="project-data">
          <div className="highlight-intro">
            <span className="highlight-dot" />
            A LITTLE MORE
            <br />
            CLARITY.
          </div>
          <div className="highlight-item">
            <span className="highlight-number">2,000</span>
            <span className="highlight-description">inventory batches<br />in the project dataset</span>
          </div>
          <div className="highlight-item">
            <span className="highlight-number">1,172</span>
            <span className="highlight-description">batches identified<br />with expiry risk</span>
          </div>
          <div className="highlight-note">
            <span className="highlight-note-icon"><LeafIcon /></span>
            <span>
              <strong>Less waste starts with knowing.</strong>
              <small>More thoughtful decisions, one fresh ingredient at a time.</small>
            </span>
          </div>
        </section>

        <DashboardPreview />
      </main>

      <footer className="landing-footer">
        <a aria-label="WasteWise AI home" className="footer-brand" href="#home">
          <LeafIcon /> WasteWise AI
        </a>
        <span>Good food deserves a future.</span>
        <a className="back-to-top" href="#home">Back to the beginning ↑</a>
      </footer>
    </div>
  );
}

export default Landing;
