
import { useEffect, useMemo, useState } from "react";
import "./GeoImageGallery.css";

const STORAGE_KEY = "geowatershed_field_assets";

function loadAssets() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Unable to load field assets:", error);
    return [];
  }
}

export default function GeoImageGallery() {
  const [assets, setAssets] = useState(loadAssets);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [conditionFilter, setConditionFilter] = useState("All");
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    const refreshAssets = () => setAssets(loadAssets());

    window.addEventListener("fieldAssetsUpdated", refreshAssets);
    window.addEventListener("storage", refreshAssets);

    return () => {
      window.removeEventListener("fieldAssetsUpdated", refreshAssets);
      window.removeEventListener("storage", refreshAssets);
    };
  }, []);

  const imageAssets = useMemo(
    () => assets.filter((asset) => asset.image),
    [assets]
  );

  const assetTypes = useMemo(
    () => [...new Set(imageAssets.map((asset) => asset.assetType || "Other"))],
    [imageAssets]
  );

  const conditions = useMemo(
    () => [...new Set(imageAssets.map((asset) => asset.condition || "Unknown"))],
    [imageAssets]
  );

  const filteredImages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return imageAssets.filter((asset) => {
      const matchesSearch = [
        asset.assetName,
        asset.assetType,
        asset.condition,
        asset.description,
        asset.latitude,
        asset.longitude,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesType =
        typeFilter === "All" || (asset.assetType || "Other") === typeFilter;

      const matchesCondition =
        conditionFilter === "All" ||
        (asset.condition || "Unknown") === conditionFilter;

      return matchesSearch && matchesType && matchesCondition;
    });
  }, [imageAssets, search, typeFilter, conditionFilter]);

  const openLocation = (asset) => {
    const latitude = Number(asset.latitude);
    const longitude = Number(asset.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      alert("This asset does not have valid GPS coordinates.");
      return;
    }

    const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="gallery-page">
      <header className="gallery-header">
        <div>
          <span className="gallery-eyebrow">GEOSPATIAL MONITORING</span>
          <h2>Geo-tagged Image Gallery</h2>
          <p>
            Explore field images and their recorded geographic information.
          </p>
        </div>

        <div className="gallery-total">
          <span>Total Images</span>
          <strong>{imageAssets.length}</strong>
        </div>
      </header>

      <section className="gallery-stats">
        <div className="gallery-stat-card">
          <span>All Images</span>
          <strong>{imageAssets.length}</strong>
        </div>
        <div className="gallery-stat-card">
          <span>Good Condition</span>
          <strong>
            {imageAssets.filter((asset) => asset.condition === "Good").length}
          </strong>
        </div>
        <div className="gallery-stat-card">
          <span>Pending Review</span>
          <strong>
            {imageAssets.filter(
              (asset) => (asset.status || "Pending Review") === "Pending Review"
            ).length}
          </strong>
        </div>
        <div className="gallery-stat-card">
          <span>Geo-tagged</span>
          <strong>
            {imageAssets.filter((asset) => {
              const lat = Number(asset.latitude);
              const lng = Number(asset.longitude);
              return (
                Number.isFinite(lat) &&
                lat >= -90 &&
                lat <= 90 &&
                Number.isFinite(lng) &&
                lng >= -180 &&
                lng <= 180
              );
            }).length}
          </strong>
        </div>
      </section>

      <section className="gallery-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, type, condition or coordinates..."
          aria-label="Search images"
        />

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filter by asset type"
        >
          <option value="All">All Asset Types</option>
          {assetTypes.map((type) => (
            <option value={type} key={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={conditionFilter}
          onChange={(event) => setConditionFilter(event.target.value)}
          aria-label="Filter by condition"
        >
          <option value="All">All Conditions</option>
          {conditions.map((condition) => (
            <option value={condition} key={condition}>
              {condition}
            </option>
          ))}
        </select>
      </section>

      <div className="gallery-result-count">
        Showing {filteredImages.length} of {imageAssets.length} images
      </div>

      {filteredImages.length === 0 ? (
        <section className="gallery-empty">
          <div className="gallery-empty-icon">▧</div>
          <h3>No images found</h3>
          <p>
            Add a field asset with an image in the Field Assets page, or change
            your search and filters.
          </p>
        </section>
      ) : (
        <section className="gallery-grid">
          {filteredImages.map((asset) => (
            <article className="gallery-card" key={asset.id}>
              <button
                className="gallery-image-button"
                type="button"
                onClick={() => setSelectedAsset(asset)}
                aria-label={`View details for ${asset.assetName || "field asset"}`}
              >
                <img
                  src={asset.image}
                  alt={asset.assetName || "Geo-tagged field observation"}
                  className="gallery-image"
                />
                <span className="gallery-image-open">View Details ↗</span>
              </button>

              <div className="gallery-card-content">
                <div className="gallery-card-heading">
                  <div>
                    <h3>{asset.assetName || "Unnamed Field Asset"}</h3>
                    <span className="gallery-type">
                      {asset.assetType || "Other"}
                    </span>
                  </div>
                  <span
                    className={`gallery-condition condition-${(
                      asset.condition || "unknown"
                    )
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {asset.condition || "Unknown"}
                  </span>
                </div>

                <div className="gallery-coordinates">
                  <span>⌖</span>
                  {Number.isFinite(Number(asset.latitude)) &&
                  Number.isFinite(Number(asset.longitude))
                    ? `${Number(asset.latitude).toFixed(5)}, ${Number(
                        asset.longitude
                      ).toFixed(5)}`
                    : "No GPS coordinates"}
                </div>

                <div className="gallery-card-footer">
                  <span>
                    {asset.createdAt
                      ? new Date(asset.createdAt).toLocaleDateString()
                      : "Date unavailable"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    Details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {selectedAsset && (
        <div
          className="gallery-modal-backdrop"
          onClick={() => setSelectedAsset(null)}
          role="presentation"
        >
          <section
            className="gallery-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="gallery-modal-header">
              <div>
                <span className="gallery-eyebrow">FIELD OBSERVATION</span>
                <h2 id="gallery-modal-title">
                  {selectedAsset.assetName || "Unnamed Field Asset"}
                </h2>
              </div>
              <button
                type="button"
                className="gallery-close"
                onClick={() => setSelectedAsset(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <img
              src={selectedAsset.image}
              alt={selectedAsset.assetName || "Field observation"}
              className="gallery-modal-image"
            />

            <div className="gallery-detail-grid">
              <div>
                <span>Asset Type</span>
                <strong>{selectedAsset.assetType || "Other"}</strong>
              </div>
              <div>
                <span>Condition</span>
                <strong>{selectedAsset.condition || "Unknown"}</strong>
              </div>
              <div>
                <span>Review Status</span>
                <strong>{selectedAsset.status || "Pending Review"}</strong>
              </div>
              <div>
                <span>Recorded Date</span>
                <strong>
                  {selectedAsset.createdAt
                    ? new Date(selectedAsset.createdAt).toLocaleString()
                    : "Not available"}
                </strong>
              </div>
              <div>
                <span>Latitude</span>
                <strong>{selectedAsset.latitude ?? "Not available"}</strong>
              </div>
              <div>
                <span>Longitude</span>
                <strong>{selectedAsset.longitude ?? "Not available"}</strong>
              </div>
            </div>

            <div className="gallery-description">
              <span>Description</span>
              <p>{selectedAsset.description || "No description provided."}</p>
            </div>

            <div className="gallery-modal-actions">
              <button
                type="button"
                className="gallery-map-button"
                onClick={() => openLocation(selectedAsset)}
              >
                View Location on Map ↗
              </button>
              <button
                type="button"
                className="gallery-secondary-button"
                onClick={() => setSelectedAsset(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}