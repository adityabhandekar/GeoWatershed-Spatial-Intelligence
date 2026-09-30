
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { Layers3 } from "lucide-react";

import watershedRaw from "../data/watershed.geojson?raw";
import drainageRaw from "../data/drainage.geojson?raw";
import fieldAssetsRaw from "../data/field-assets.geojson?raw";

function parseGeoJSON(raw, label) {
  try {
    const data = JSON.parse(raw);

    if (
      !data ||
      !["FeatureCollection", "Feature"].includes(data.type)
    ) {
      throw new Error("Invalid GeoJSON type");
    }

    return data;
  } catch (error) {
    console.error(`${label} GeoJSON error:`, error);
    return null;
  }
}

const watershedData = parseGeoJSON(watershedRaw, "Watershed");
const drainageData = parseGeoJSON(drainageRaw, "Drainage");
const fieldData = parseGeoJSON(fieldAssetsRaw, "Field assets");

function FitBounds({ data }) {
  const map = useMap();

  useEffect(() => {
    if (!data) return;

    try {
      const layer = L.geoJSON(data);
      const bounds = layer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    } catch (error) {
      console.error("Unable to fit GeoJSON bounds:", error);
    }
  }, [map, data]);

  return null;
}

import L from "leaflet";

function getAssetName(feature, index) {
  const properties = feature?.properties || {};
  return (
    properties.name ||
    properties.Name ||
    properties.asset_name ||
    properties.type ||
    `Field Asset ${index + 1}`
  );
}

function getAssetType(feature) {
  const properties = feature?.properties || {};
  return (
    properties.type ||
    properties.asset_type ||
    properties.category ||
    "Field Asset"
  );
}

export default function MapView({
  layers,
  onSelectAsset,
  basemap,
}) {
  const assets = useMemo(() => {
    const features =
      fieldData?.type === "FeatureCollection"
        ? fieldData.features
        : fieldData?.type === "Feature"
          ? [fieldData]
          : [];

    return features.filter(
      (feature) =>
        feature.geometry &&
        ["Point", "MultiPoint"].includes(feature.geometry.type)
    );
  }, []);

  const baseUrl =
    basemap === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className="map-canvas">
      <MapContainer
        center={[19.3, 75.7]}
        zoom={10}
        scrollWheelZoom
        className="leaflet-map"
      >
        <TileLayer
          key={basemap}
          attribution={
            basemap === "satellite"
              ? "Tiles © Esri"
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }
          url={baseUrl}
        />

        <FitBounds data={watershedData} />

        {layers.watershed && watershedData && (
          <GeoJSON
            key="watershed"
            data={watershedData}
            style={{
              color: "#0d9488",
              weight: 3,
              opacity: 1,
              fillColor: "#14b8a6",
              fillOpacity: 0.12,
            }}
          />
        )}

        {layers.drainage && drainageData && (
          <GeoJSON
            key="drainage"
            data={drainageData}
            style={{
              color: "#1685e6",
              weight: 2,
              opacity: 0.9,
            }}
          />
        )}

        {layers.fieldAssets &&
          assets.map((feature, index) => {
            const coords = feature.geometry.coordinates;
            const positions =
              feature.geometry.type === "Point"
                ? [coords[1], coords[0]]
                : null;

            if (!positions) return null;

            const name = getAssetName(feature, index);
            const type = getAssetType(feature);

            return (
              <CircleMarker
                key={`asset-${index}`}
                center={positions}
                radius={7}
                pathOptions={{
                  color: "#ffffff",
                  weight: 2,
                  fillColor: "#f59e0b",
                  fillOpacity: 1,
                }}
                eventHandlers={{
                  click: () =>
                    onSelectAsset({
                      ...feature.properties,
                      name,
                      type,
                      coordinates: positions,
                    }),
                }}
              >
                <Popup>
                  <strong>{name}</strong>
                  <br />
                  {type}
                  <br />
                  <button
                    onClick={() =>
                      onSelectAsset({
                        ...feature.properties,
                        name,
                        type,
                        coordinates: positions,
                      })
                    }
                  >
                    View details
                  </button>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      <div className="map-attribution">
        <Layers3 size={13} />
        Interactive GIS map
      </div>
    </div>
  );
}