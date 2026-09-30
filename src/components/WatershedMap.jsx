
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const STORAGE_KEY = "geowatershed_field_assets";

const DATA_URLS = {
  watershed: "/data/watershed.geojson",
  drainage: "/data/drainage.geojson",
};

const initialLayers = {
  watershed: true,
  drainage: true,
  assets: true,
};

function readSavedAssets() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read field assets:", error);
    return [];
  }
}

function isFeatureCollection(data) {
  return (
    data &&
    data.type === "FeatureCollection" &&
    Array.isArray(data.features)
  );
}

function getAssetName(asset) {
  return asset.assetName || asset.name || "Field Asset";
}

function getAssetType(asset) {
  return asset.assetType || asset.type || "Field Asset";
}

function MapFitBounds({ data }) {
  const map = useMap();

  useEffect(() => {
    if (!data) return;

    try {
      const layer = L.geoJSON(data);
      const bounds = layer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [25, 25], maxZoom: 13 });
      }
    } catch (error) {
      console.error("Could not fit map to watershed:", error);
    }
  }, [data, map]);

  return null;
}

export default function WatershedMap({
  search = "",
  onCounts,
  onSelectAsset,
}) {
  const [watershed, setWatershed] = useState(null);
  const [drainage, setDrainage] = useState(null);
  const [fieldAssets, setFieldAssets] = useState(readSavedAssets);
  const [layers, setLayers] = useState(initialLayers);
  const [baseMap, setBaseMap] = useState("Street");
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");

  const refreshFieldAssets = useCallback(() => {
    setFieldAssets(readSavedAssets());
  }, []);

  useEffect(() => {
    const loadGeoJSON = async () => {
      setLoading(true);
      setMapError("");

      try {
        const [watershedResponse, drainageResponse] = await Promise.all([
          fetch(DATA_URLS.watershed),
          fetch(DATA_URLS.drainage),
        ]);

        if (!watershedResponse.ok) {
          throw new Error(
            `Watershed GeoJSON could not be loaded (${watershedResponse.status}).`
          );
        }

        if (!drainageResponse.ok) {
          throw new Error(
            `Drainage GeoJSON could not be loaded (${drainageResponse.status}).`
          );
        }

        const [watershedData, drainageData] = await Promise.all([
          watershedResponse.json(),
          drainageResponse.json(),
        ]);

        if (!isFeatureCollection(watershedData)) {
          throw new Error("Watershed file is not a valid GeoJSON FeatureCollection.");
        }

        if (!isFeatureCollection(drainageData)) {
          throw new Error("Drainage file is not a valid GeoJSON FeatureCollection.");
        }

        setWatershed(watershedData);
        setDrainage(drainageData);
      } catch (error) {
        console.error("GeoJSON loading error:", error);
        setMapError(
          error.message ||
            "Unable to load map data. Check your GeoJSON files and paths."
        );
      } finally {
        setLoading(false);
      }
    };

    loadGeoJSON();
  }, []);

  useEffect(() => {
    refreshFieldAssets();

    window.addEventListener("fieldAssetsUpdated", refreshFieldAssets);
    window.addEventListener("storage", refreshFieldAssets);

    return () => {
      window.removeEventListener("fieldAssetsUpdated", refreshFieldAssets);
      window.removeEventListener("storage", refreshFieldAssets);
    };
  }, [refreshFieldAssets]);

  const validAssets = useMemo(() => {
    return fieldAssets.filter((asset) => {
      const latitude = Number(asset.latitude);
      const longitude = Number(asset.longitude);

      return (
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180
      );
    });
  }, [fieldAssets]);

  const visibleAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return validAssets;

    return validAssets.filter((asset) =>
      [
        getAssetName(asset),
        getAssetType(asset),
        asset.condition,
        asset.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [validAssets, search]);

  useEffect(() => {
    if (typeof onCounts === "function") {
      onCounts({
        watershed: watershed?.features?.length || 0,
        drainage: drainage?.features?.length || 0,
        assets: validAssets.length,
      });
    }
  }, [watershed, drainage, validAssets, onCounts]);

  const toggleLayer = (layerName) => {
    setLayers((previous) => ({
      ...previous,
      [layerName]: !previous[layerName],
    }));
  };

  const getBaseMapUrl = () => {
    if (baseMap === "Satellite") {
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }

    if (baseMap === "Terrain") {
      return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
    }

    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  };

  const getBaseMapAttribution = () => {
    if (baseMap === "Satellite") {
      return "Tiles © Esri";
    }

    if (baseMap === "Terrain") {
      return "Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap";
    }

    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  };

  const watershedStyle = {
    color: "#0d9488",
    weight: 3,
    opacity: 1,
    fillColor: "#14b8a6",
    fillOpacity: 0.16,
  };

  const drainageStyle = {
    color: "#3b82f6",
    weight: 2,
    opacity: 0.9,
  };

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e0e9ee",
        borderRadius: 12,
        padding: 14,
        color: "#20364a",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              color: "#0d9488",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 5,
            }}
          >
            GEOSPATIAL MONITORING
          </div>
          <h3 style={{ margin: 0, fontSize: 17 }}>Interactive Watershed Map</h3>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#718398" }}>
            Explore watershed boundaries, drainage networks and field assets.
          </p>
        </div>

        <select
          value={baseMap}
          onChange={(event) => setBaseMap(event.target.value)}
          aria-label="Select map style"
          style={{
            padding: "8px 10px",
            border: "1px solid #d6e2e9",
            borderRadius: 7,
            background: "#fff",
            color: "#405568",
            fontSize: 12,
          }}
        >
          <option value="Street">Street Map</option>
          <option value="Satellite">Satellite</option>
          <option value="Terrain">Terrain</option>
        </select>
      </div>

      {mapError && (
        <div
          role="alert"
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#9a3412",
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
            marginBottom: 10,
          }}
        >
          {mapError}
          <div style={{ marginTop: 5 }}>
            Check that the files exist in <code>public/data/</code>.
          </div>
        </div>
      )}

      {loading && (
        <div style={{ padding: 8, color: "#718398", fontSize: 12 }}>
          Loading watershed data...
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "125px minmax(0, 1fr)",
          minHeight: 420,
          height: "min(62vh, 560px)",
          border: "1px solid #dce6ec",
          borderRadius: 9,
          overflow: "hidden",
        }}
      >
        <aside
          style={{
            background: "#f8fbfc",
            borderRight: "1px solid #e0e9ee",
            padding: 10,
            zIndex: 500,
            overflowY: "auto",
          }}
        >
          <strong style={{ fontSize: 11 }}>Map Layers</strong>

          {[
            ["watershed", "Watershed Boundary", "#0d9488"],
            ["drainage", "Drainage Network", "#3b82f6"],
            ["assets", "Field Assets", "#f59e0b"],
          ].map(([key, label, color]) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 12,
                fontSize: 10,
                color: "#52677a",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={() => toggleLayer(key)}
              />
              <span
                style={{
                  width: 12,
                  height: 3,
                  borderRadius: 4,
                  background: color,
                  flexShrink: 0,
                }}
              />
              {label}
            </label>
          ))}

          <hr
            style={{
              border: 0,
              borderTop: "1px solid #e0e9ee",
              margin: "14px 0",
            }}
          />

          <strong style={{ fontSize: 11 }}>Legend</strong>
          <div style={{ fontSize: 10, color: "#718398", marginTop: 10 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 9 }}>
              <span style={{ width: 13, borderTop: "2px dashed #0d9488" }} />
              Watershed
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 9 }}>
              <span style={{ width: 13, borderTop: "2px solid #3b82f6" }} />
              Drainage
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "#f59e0b",
                }}
              />
              Field Asset
            </div>
          </div>

          <div
            style={{
              marginTop: 15,
              padding: 8,
              borderRadius: 7,
              background: "#eaf7f5",
              color: "#4b6b70",
              fontSize: 10,
              lineHeight: 1.5,
            }}
          >
            {validAssets.length} saved field asset(s) with valid coordinates.
          </div>
        </aside>

        <div style={{ minWidth: 0, minHeight: 0, position: "relative" }}>
          <MapContainer
            center={[19.0, 75.75]}
            zoom={10}
            scrollWheelZoom
            style={{ width: "100%", height: "100%", minHeight: 420 }}
          >
            <TileLayer
              key={baseMap}
              attribution={getBaseMapAttribution()}
              url={getBaseMapUrl()}
            />

            {watershed && layers.watershed && (
              <>
                <GeoJSON
                  key="watershed-layer"
                  data={watershed}
                  style={() => watershedStyle}
                  onEachFeature={(feature, layer) => {
                    const name =
                      feature.properties?.name ||
                      feature.properties?.Name ||
                      "Watershed Boundary";

                    layer.bindPopup(`<strong>${name}</strong>`);
                  }}
                />
                <MapFitBounds data={watershed} />
              </>
            )}

            {drainage && layers.drainage && (
              <GeoJSON
                key="drainage-layer"
                data={drainage}
                style={() => drainageStyle}
                onEachFeature={(feature, layer) => {
                  const name =
                    feature.properties?.name ||
                    feature.properties?.Name ||
                    "Drainage Network";

                  layer.bindPopup(`<strong>${name}</strong>`);
                }}
              />
            )}

            {layers.assets &&
              visibleAssets.map((asset) => (
                <CircleMarker
                  key={asset.id}
                  center={[
                    Number(asset.latitude),
                    Number(asset.longitude),
                  ]}
                  radius={8}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: "#f59e0b",
                    fillOpacity: 1,
                  }}
                  eventHandlers={{
                    click: () => {
                      if (typeof onSelectAsset === "function") {
                        onSelectAsset(asset);
                      }
                    },
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 150, maxWidth: 220 }}>
                      {asset.image && (
                        <img
                          src={asset.image}
                          alt={getAssetName(asset)}
                          style={{
                            width: "100%",
                            maxHeight: 120,
                            objectFit: "cover",
                            borderRadius: 5,
                            marginBottom: 7,
                          }}
                        />
                      )}
                      <strong>{getAssetName(asset)}</strong>
                      <div style={{ marginTop: 4 }}>
                        Type: {getAssetType(asset)}
                      </div>
                      <div>Condition: {asset.condition || "Not specified"}</div>
                      <div style={{ marginTop: 4, fontSize: 11 }}>
                        Lat: {Number(asset.latitude).toFixed(6)}
                        <br />
                        Lng: {Number(asset.longitude).toFixed(6)}
                      </div>
                      {asset.description && (
                        <p style={{ margin: "6px 0 0" }}>
                          {asset.description}
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 10,
          fontSize: 10,
          color: "#718398",
        }}
      >
        <span>
          <span style={{ color: "#16a34a" }}>●</span> Map workspace
          &nbsp; · &nbsp; {validAssets.length} field asset(s)
        </span>
        <span>Basemap: {baseMap}</span>
      </div>
    </section>
  );
}