
import {
  LayoutDashboard,
  Map,
  Layers,
  Image,
  ChartNoAxesCombined,
  FileBarChart,
  Settings,
} from "lucide-react";

import "./Sidebar.css";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Watershed Map", icon: Map },
  { name: "Field Assets", icon: Layers },
  { name: "Geo-tagged Images", icon: Image },
  { name: "GIS Layers", icon: Layers },
  { name: "Spatial Analysis", icon: ChartNoAxesCombined },
  { name: "Reports", icon: FileBarChart },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Map size={23} />
        </div>
        <div>
          <h2>GeoWatershed</h2>
          <span>GIS Monitoring</span>
        </div>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.name;

          return (
            <button
              type="button"
              key={item.name}
              className={`sidebar-item ${active ? "active" : ""}`}
              onClick={() => setActivePage(item.name)}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          className={`sidebar-item ${
            activePage === "Settings" ? "active" : ""
          }`}
          onClick={() => setActivePage("Settings")}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className="sidebar-version">
          <span className="version-dot" />
          GeoWatershed v1.0
        </div>
      </div>
    </aside>
  );
}