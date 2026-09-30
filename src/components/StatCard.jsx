
import {
  Layers3,
  Waves,
  MapPinned,
  Database,
} from "lucide-react";

const icons = {
  boundary: MapPinned,
  drainage: Waves,
  assets: Database,
  layers: Layers3,
};

export default function StatCard({ item }) {
  const Icon = icons[item.icon] || Layers3;

  return (
    <div className={`stat-card ${item.color}`}>
      <div className="stat-icon">
        <Icon size={21} />
      </div>

      <div className="stat-content">
        <span className="stat-title">{item.title}</span>
        <strong>{item.value}</strong>
        <span className="stat-subtitle">{item.subtitle}</span>
      </div>
    </div>
  );
}