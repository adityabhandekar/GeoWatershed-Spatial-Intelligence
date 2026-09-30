
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Search,
  Droplets,
  MapPinned,
  Layers3,
  Activity,
  FileBarChart,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import WatershedMap from "./components/WatershedMap";
import FieldAssets from "./components/FieldAssets";
import GeoImageGallery from "./components/GeoImageGallery";

import { sampleStats } from "./data/sampleData";

import "./App.css";

export default function App() {
  const [activePage, setActivePage] = useState("Watershed Map");
  const [search, setSearch] = useState("");

  // Identify pages that have their own content heading
  const isFieldAssets = activePage === "Field Assets";
  const isGeoImages = activePage === "Geo-tagged Images";
  const isSpecialPage = isFieldAssets || isGeoImages;

  // Show map dashboard content only on these pages
  const isMapPage =
    activePage === "Watershed Map" ||
    activePage === "Dashboard";

  // Render the selected page
  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
      case "Watershed Map":
        return <WatershedMap />;

      case "Field Assets":
        return <FieldAssets />;

      case "Geo-tagged Images":
        return <GeoImageGallery />;

      case "GIS Layers":
        return (
          <section className="placeholder-panel">
            <div className="placeholder-icon">
              <Layers3 size={28} />
            </div>

            <h2>GIS Layers</h2>

            <p>
              The GIS Layers workspace is ready for the
              next development stage.
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={() => setActivePage("Watershed Map")}
            >
              Return to Watershed Map
            </button>
          </section>
        );

      case "Spatial Analysis":
        return (
          <section className="placeholder-panel">
            <div className="placeholder-icon">
              <Activity size={28} />
            </div>

            <h2>Spatial Analysis</h2>

            <p>
              The Spatial Analysis workspace is ready for
              the next development stage.
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={() => setActivePage("Watershed Map")}
            >
              Return to Watershed Map
            </button>
          </section>
        );

      case "Reports":
        return (
          <section className="placeholder-panel">
            <div className="placeholder-icon">
              <FileBarChart size={28} />
            </div>

            <h2>Reports</h2>

            <p>
              The Reports workspace is ready for the
              next development stage.
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={() => setActivePage("Watershed Map")}
            >
              Return to Watershed Map
            </button>
          </section>
        );

      case "Settings":
        return (
          <section className="placeholder-panel">
            <div className="placeholder-icon">
              <Activity size={28} />
            </div>

            <h2>Settings</h2>

            <p>
              Application settings will be available here.
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={() => setActivePage("Watershed Map")}
            >
              Return to Watershed Map
            </button>
          </section>
        );

      default:
        return (
          <section className="placeholder-panel">
            <h2>{activePage}</h2>

            <p>
              This workspace is not available yet.
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={() => setActivePage("Watershed Map")}
            >
              Return to Watershed Map
            </button>
          </section>
        );
    }
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* TOP NAVIGATION */}
        <header className="topbar">
          <div className="mobile-brand">
            <Droplets size={22} />
            <strong>GeoWatershed</strong>
          </div>

          <div className="global-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search field assets, layers..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="topbar-actions">
            <button
              className="notification-button"
              aria-label="Notifications"
              title="Notifications"
              type="button"
            >
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <div className="profile-menu">
              <div className="profile-avatar">
                WP
              </div>

              <div className="profile-label">
                <strong>Watershed Planner</strong>
                <span>Planning team</span>
              </div>

              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="page-content">
          {/* DASHBOARD HEADING AND STATISTICS */}
          {!isSpecialPage && (
            <>
              <div className="page-heading">
                <div>
                  <span className="section-label">
                    GEOSPATIAL INTELLIGENCE / PHASE 02
                  </span>

                  <h1>{activePage}</h1>

                  <p>
                    Visualize spatial data, explore drainage
                    systems and monitor field assets.
                  </p>
                </div>

                <span className="demo-badge">
                  <span className="status-dot" />
                  Interactive GIS Workspace
                </span>
              </div>

              {/* DASHBOARD STATISTICS */}
              <div className="stats-grid">
                {sampleStats.map((item) => (
                  <StatCard
                    key={item.title}
                    item={item}
                  />
                ))}
              </div>
            </>
          )}

          {/* FIELD ASSETS HEADING */}
          {isFieldAssets && (
            <div className="page-heading">
              <div>
                <span className="section-label">
                  GEOSPATIAL INTELLIGENCE / PHASE 03
                </span>

                <h1>Field Asset Monitoring</h1>

                <p>
                  Capture, record and monitor geotagged
                  field assets.
                </p>
              </div>
            </div>
          )}

          {/* GEO-TAGGED IMAGES HEADING */}
          {isGeoImages && (
            <div className="page-heading">
              <div>
                <span className="section-label">
                  GEOSPATIAL INTELLIGENCE / PHASE 04
                </span>

                <h1>Geo-tagged Images</h1>

                <p>
                  Explore field photographs, geographic
                  locations and observation details.
                </p>
              </div>
            </div>
          )}

          {/* SELECTED PAGE */}
          {renderPage()}

          {/* FEATURE CARDS - MAP PAGES ONLY */}
          {isMapPage && (
            <div className="feature-grid">
              <article className="feature-card">
                <div className="feature-icon teal">
                  <MapPinned size={19} />
                </div>

                <div>
                  <h3>Spatial Data</h3>

                  <p>
                    Load watershed boundaries, drainage
                    networks and geo-tagged field observations.
                  </p>
                </div>
              </article>

              <article className="feature-card">
                <div className="feature-icon blue">
                  <Layers3 size={19} />
                </div>

                <div>
                  <h3>GIS Layer Control</h3>

                  <p>
                    Switch thematic layers independently
                    to inspect spatial relationships.
                  </p>
                </div>
              </article>

              <article className="feature-card">
                <div className="feature-icon orange">
                  <Droplets size={19} />
                </div>

                <div>
                  <h3>Field Monitoring</h3>

                  <p>
                    Select mapped assets to review their
                    location and observation details.
                  </p>
                </div>
              </article>
            </div>
          )}

          {/* FOOTER */}
          <footer className="page-footer">
            <span>
              GeoWatershed ·{" "}
              {isFieldAssets
                ? "Phase 03 · Field Monitoring"
                : isGeoImages
                ? "Phase 04 · Geo-tagged Image Analysis"
                : "Phase 02 · Interactive Mapping"}
            </span>

            <span>
              Static frontend · No database required
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}