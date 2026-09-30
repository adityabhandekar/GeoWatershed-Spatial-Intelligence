
import { useEffect, useState } from "react";

const STORAGE_KEY = "geowatershed_field_assets";

const emptyForm = {
  assetName: "",
  assetType: "Water Body",
  condition: "Good",
  latitude: "",
  longitude: "",
  description: "",
  image: "",
};

function readAssets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (error) {
    console.error("Could not read saved field assets:", error);
    return [];
  }
}

function saveAssets(assets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  window.dispatchEvent(new Event("fieldAssetsUpdated"));
}

export default function FieldAssets() {
  const [assets, setAssets] = useState(readAssets);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [imageName, setImageName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const refreshAssets = () => setAssets(readAssets());

    window.addEventListener("fieldAssetsUpdated", refreshAssets);
    window.addEventListener("storage", refreshAssets);

    return () => {
      window.removeEventListener("fieldAssetsUpdated", refreshAssets);
      window.removeEventListener("storage", refreshAssets);
    };
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Image size must be 10 MB or less.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDimension = 1000;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.width, image.height)
        );

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        setForm((previous) => ({
          ...previous,
          image: canvas.toDataURL("image/jpeg", 0.75),
        }));

        setImageName(file.name);
        setMessage("");
      };

      image.onerror = () => setMessage("Could not process this image.");
      image.src = reader.result;
    };

    reader.onerror = () => setMessage("Could not read this image.");
    reader.readAsDataURL(file);
  };

  const getCurrentGPS = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by this browser.");
      return;
    }

    setMessage("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((previous) => ({
          ...previous,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setMessage("GPS coordinates captured.");
      },
      (error) => {
        setMessage(
          error.code === 1
            ? "Location permission was denied. Allow location access in your browser."
            : "Unable to get location. Try again or enter coordinates manually."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!form.image) {
      setMessage("Please upload an image.");
      return;
    }

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setMessage("Enter valid latitude and longitude coordinates.");
      return;
    }

    const newAsset = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      assetName: form.assetName.trim(),
      assetType: form.assetType,
      condition: form.condition,
      latitude,
      longitude,
      description: form.description.trim(),
      image: form.image,
      status: "Pending Review",
      createdAt: new Date().toISOString(),
    };

    const updatedAssets = [newAsset, ...readAssets()];

    try {
      saveAssets(updatedAssets);
      setAssets(updatedAssets);
      setForm(emptyForm);
      setImageName("");
      setMessage("Field asset saved. It is now available on the map.");
      event.target.reset();
    } catch (error) {
      console.error("Could not save field asset:", error);
      setMessage(
        "Could not save this asset. The browser's local storage may be full."
      );
    }
  };

  const deleteAsset = (id) => {
    const updatedAssets = readAssets().filter((asset) => asset.id !== id);

    try {
      saveAssets(updatedAssets);
      setAssets(updatedAssets);
      setMessage("Field asset deleted.");
    } catch (error) {
      console.error("Could not delete field asset:", error);
      setMessage("Could not delete this asset.");
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = [
      asset.assetName,
      asset.assetType,
      asset.condition,
      asset.description,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || asset.status === filter;

    return matchesSearch && matchesFilter;
  });

  const openLocation = (asset) => {
    const url = `https://www.openstreetmap.org/?mlat=${asset.latitude}&mlon=${asset.longitude}#map=16/${asset.latitude}/${asset.longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #d6e2e9",
    borderRadius: 8,
    background: "#fff",
    color: "#243746",
    boxSizing: "border-box",
    fontSize: 13,
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#405568",
    marginBottom: 7,
  };

  const buttonStyle = {
    border: 0,
    borderRadius: 8,
    padding: "10px 15px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        padding: 24,
        color: "#20364a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              color: "#0d9488",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 7,
            }}
          >
            GEOSPATIAL MONITORING
          </div>
          <h2 style={{ margin: 0, fontSize: 24 }}>Field Asset Monitoring</h2>
          <p style={{ margin: "7px 0 0", color: "#718398", fontSize: 13 }}>
            Capture geo-tagged images and monitor watershed assets.
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e0e9ee",
            borderRadius: 12,
            padding: "12px 20px",
            minWidth: 90,
          }}
        >
          <div style={{ color: "#718398", fontSize: 11 }}>Total Assets</div>
          <strong style={{ fontSize: 23 }}>{assets.length}</strong>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          ["Total Images", assets.filter((asset) => asset.image).length],
          ["Geo-tagged", assets.filter(
            (asset) =>
              Number.isFinite(Number(asset.latitude)) &&
              Number.isFinite(Number(asset.longitude))
          ).length],
          ["Pending Review", assets.filter(
            (asset) => asset.status === "Pending Review"
          ).length],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              background: "#fff",
              border: "1px solid #e0e9ee",
              borderRadius: 11,
              padding: 17,
            }}
          >
            <div style={{ color: "#718398", fontSize: 12 }}>{label}</div>
            <strong style={{ fontSize: 22 }}>{value}</strong>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 0.9fr) minmax(320px, 1.5fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            border: "1px solid #e0e9ee",
            borderRadius: 12,
            padding: 18,
          }}
        >
          <h3 style={{ margin: "0 0 5px", fontSize: 16 }}>
            + Add Field Asset
          </h3>
          <p style={{ color: "#718398", fontSize: 12, margin: "0 0 18px" }}>
            Upload an image and provide its location and details.
          </p>

          <div style={{ marginBottom: 15 }}>
            <label style={labelStyle}>Field Image *</label>
            <label
              style={{
                display: "flex",
                minHeight: 120,
                border: "1px dashed #8dcac5",
                borderRadius: 9,
                background: "#f5fbfa",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
                cursor: "pointer",
                overflow: "hidden",
                padding: 10,
                textAlign: "center",
              }}
            >
              {form.image ? (
                <img
                  src={form.image}
                  alt="Selected field asset"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 150,
                    objectFit: "contain",
                  }}
                />
              ) : (
                <>
                  <span style={{ fontSize: 24, color: "#0d9488" }}>▧</span>
                  <strong style={{ fontSize: 12 }}>Upload or capture image</strong>
                  <span style={{ fontSize: 10, color: "#718398" }}>
                    JPG, PNG or other image formats · Max 10 MB
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImage}
                style={{ display: "none" }}
              />
            </label>
            {imageName && (
              <div style={{ fontSize: 11, color: "#718398", marginTop: 5 }}>
                {imageName}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={labelStyle}>Asset Name *</label>
            <input
              name="assetName"
              value={form.assetName}
              onChange={updateField}
              placeholder="e.g. Check Dam near Village"
              required
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 15,
            }}
          >
            <div>
              <label style={labelStyle}>Asset Type</label>
              <select
                name="assetType"
                value={form.assetType}
                onChange={updateField}
                style={inputStyle}
              >
                <option>Water Body</option>
                <option>Check Dam</option>
                <option>Farm Pond</option>
                <option>Percolation Tank</option>
                <option>Drainage</option>
                <option>Watershed Structure</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Condition</label>
              <select
                name="condition"
                value={form.condition}
                onChange={updateField}
                style={inputStyle}
              >
                <option>Good</option>
                <option>Moderate</option>
                <option>Poor</option>
                <option>Damaged</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <label style={labelStyle}>GPS Coordinates *</label>
              <button
                type="button"
                onClick={getCurrentGPS}
                style={{
                  ...buttonStyle,
                  background: "#e7f7f4",
                  color: "#087f75",
                  padding: "7px 10px",
                  marginBottom: 7,
                }}
              >
                ⌖ Get Current GPS
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label style={{ ...labelStyle, fontWeight: 400 }}>
                  Latitude
                </label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={updateField}
                  placeholder="e.g. 19.123456"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, fontWeight: 400 }}>
                  Longitude
                </label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={updateField}
                  placeholder="e.g. 75.123456"
                  required
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Describe the asset, water level, soil condition, vegetation, etc."
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {message && (
            <p
              role="status"
              style={{
                fontSize: 12,
                color: message.toLowerCase().includes("could not") ||
                  message.toLowerCase().includes("valid") ||
                  message.toLowerCase().includes("denied")
                  ? "#b45309"
                  : "#087f75",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            style={{
              ...buttonStyle,
              background: "#0d9488",
              color: "#fff",
              width: "100%",
            }}
          >
            Save Field Asset
          </button>
        </form>

        <section
          style={{
            background: "#fff",
            border: "1px solid #e0e9ee",
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              marginBottom: 15,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Saved Field Assets</h3>
              <p style={{ color: "#718398", fontSize: 12, margin: "5px 0 0" }}>
                Review your geo-tagged field observations.
              </p>
            </div>
            <span
              style={{
                background: "#e7f7f4",
                color: "#087f75",
                borderRadius: 20,
                padding: "5px 9px",
                fontSize: 11,
              }}
            >
              {filteredAssets.length} records
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 130px",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assets..."
              style={inputStyle}
            />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              style={inputStyle}
            >
              <option>All</option>
              <option>Pending Review</option>
              <option>Verified</option>
            </select>
          </div>

          {filteredAssets.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#718398",
                padding: 30,
                fontSize: 13,
              }}
            >
              No field assets found.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filteredAssets.map((asset) => (
                <article
                  key={asset.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    border: "1px solid #e0e9ee",
                    borderRadius: 9,
                    padding: 10,
                    minWidth: 0,
                  }}
                >
                  {asset.image && (
                    <img
                      src={asset.image}
                      alt={asset.assetName}
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ fontSize: 13 }}>{asset.assetName}</strong>
                    <div style={{ color: "#0d9488", fontSize: 11, marginTop: 5 }}>
                      {asset.assetType}
                    </div>
                    <div style={{ color: "#718398", fontSize: 11, marginTop: 5 }}>
                      Condition: {asset.condition}
                    </div>
                    <div style={{ color: "#718398", fontSize: 10, marginTop: 5 }}>
                      ⌖ {Number(asset.latitude).toFixed(5)},{" "}
                      {Number(asset.longitude).toFixed(5)}
                    </div>
                    <div style={{ color: "#718398", fontSize: 10, marginTop: 4 }}>
                      {new Date(asset.createdAt).toLocaleString()}
                    </div>
                    {asset.description && (
                      <p style={{ color: "#718398", fontSize: 11, margin: "6px 0" }}>
                        {asset.description}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => openLocation(asset)}
                        style={{
                          border: 0,
                          padding: 0,
                          background: "transparent",
                          color: "#0d9488",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        View Location
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAsset(asset.id)}
                        style={{
                          border: 0,
                          padding: 0,
                          background: "transparent",
                          color: "#dc2626",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <span
                    style={{
                      alignSelf: "flex-start",
                      borderRadius: 20,
                      background: "#fff4df",
                      color: "#a16207",
                      fontSize: 10,
                      padding: "5px 7px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {asset.status || "Pending Review"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}