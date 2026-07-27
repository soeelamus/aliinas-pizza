import { useEffect, useMemo, useState } from "react";
import Loading from "../Loading/Loading";

const API_URL = "/api/stock";
const LOCAL_URL = "/json/stock.json";

const normalizeStockArray = (data) => {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item) => {
      if (!item) return false;
      if (item.id === undefined && !item.name) return false;

      // Supabase-producten:
      // enkel artikelen tonen waarvan voorraad echt bijgehouden wordt.
      if (item.track_stock !== undefined) {
        return item.track_stock === true;
      }

      // Oude lokale fallback:
      // pizza's hebben normaal geen stockrecord en extra's beginnen met 9.
      return !String(item.id ?? "").startsWith("9");
    })
    .map((item) => ({
      id: Number(item.id),
      name: item.name ?? "",
      stock:
        item.stock === null || item.stock === undefined
          ? 0
          : Number(item.stock),
      category: item.category ?? "",
      track_stock:
        item.track_stock === undefined
          ? true
          : Boolean(item.track_stock),
    }))
    .filter(
      (item) =>
        Number.isInteger(item.id) &&
        item.id > 0 &&
        Number.isFinite(item.stock),
    );
};

const fetchJsonStrict = async (url, options = {}) => {
  const res = await fetch(url, {
    cache: "no-store",
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON from ${url}, got ${contentType}: ${text.slice(0, 80)}`,
    );
  }

  let json;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}`);
  }

  if (!res.ok) {
    throw new Error(
      json?.error ||
        json?.message ||
        `Request failed with HTTP ${res.status}`,
    );
  }

  if (json && typeof json === "object" && json.ok === false) {
    throw new Error(json.error || "API returned ok:false");
  }

  return json;
};

export default function StockForm() {
  const [stockItems, setStockItems] = useState([]);
  const [message, setMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [source, setSource] = useState("");

  const getKitchenHeaders = () => ({
    "Content-Type": "application/json",
    "x-kitchen-token": localStorage.getItem("kitchenAuth") || "",
  });

  const fetchStockWithFallback = async () => {
    try {
      const apiData = await fetchJsonStrict(API_URL);

      setSource("api");

      return normalizeStockArray(apiData);
    } catch (apiError) {
      console.warn(
        "Stock API unavailable, using local fallback:",
        apiError,
      );

      const localData = await fetchJsonStrict(LOCAL_URL);

      setSource("local");

      return normalizeStockArray(localData);
    }
  };

  const loadStock = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const items = await fetchStockWithFallback();

      setStockItems(items);
      setIsDirty(false);
    } catch (error) {
      console.error("Stock load error:", error);

      setMessage(
        "Voorraad kon niet geladen worden via de API of lokale fallback.",
      );

      setStockItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleChange = (id, value) => {
    setStockItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              stock: value,
            }
          : item,
      ),
    );

    setIsDirty(true);
    setMessage("");
  };

  const canSubmit = useMemo(() => {
    return isDirty && source === "api" && !isSaving;
  }, [isDirty, source, isSaving]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (source !== "api") {
      setMessage(
        "De lokale stock.json is alleen-lezen. Voorraad kan momenteel niet opgeslagen worden.",
      );

      return;
    }

    const updates = stockItems.map((item) => ({
      id: item.id,
      stock:
        item.stock === ""
          ? 0
          : Math.max(0, Number(item.stock)),
    }));

    const hasInvalidValue = updates.some(
      (item) =>
        !Number.isInteger(item.id) ||
        !Number.isFinite(item.stock),
    );

    if (hasInvalidValue) {
      setMessage("Controleer de ingevoerde voorraadwaarden.");
      return;
    }

    setIsSaving(true);
    setMessage("Voorraad wordt opgeslagen...");

    try {
      const result = await fetchJsonStrict(API_URL, {
        method: "POST",
        headers: getKitchenHeaders(),
        body: JSON.stringify(updates),
      });

      const updatedById = new Map(
        (result.updated || []).map((item) => [
          Number(item.id),
          item,
        ]),
      );

      setStockItems((currentItems) =>
        currentItems.map((item) => {
          const updated = updatedById.get(item.id);

          if (!updated) return item;

          return {
            ...item,
            stock: Number(updated.stock),
          };
        }),
      );

      setIsDirty(false);
      setMessage("Voorraad opgeslagen.");
    } catch (error) {
      console.error("Stock update error:", error);

      setMessage(
        error.message || "Voorraad kon niet opgeslagen worden.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading innerHTML="Voorraad laden" />;
  }

  if (stockItems.length === 0) {
    return (
      <div className="kitchen-section form">
        <h1 className="monoton-regular white">Voorraad</h1>
        <p>{message || "Geen voorraadartikelen gevonden."}</p>

        <button
          type="button"
          className="btn-purple btn-margin"
          onClick={loadStock}
        >
          Opnieuw laden
        </button>
      </div>
    );
  }

  return (
    <div className="kitchen-section form">
      <h1 className="monoton-regular white">Voorraad</h1>

      {source === "local" && (
        <p>
          Lokale fallback actief. Wijzigingen kunnen niet worden
          opgeslagen.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        {stockItems.map((item) => (
          <div key={item.id}>
            <label className="form-text">
              {item.name}:{" "}
              <input
                type="number"
                min="0"
                step="1"
                value={item.stock}
                onChange={(event) =>
                  handleChange(item.id, event.target.value)
                }
                disabled={isSaving}
              />
            </label>
          </div>
        ))}

        <br />

        <button
          className="btn-purple btn-margin"
          type="submit"
          disabled={!canSubmit}
        >
          {isSaving ? "Opslaan..." : "Update"}
        </button>

        <button
          className="btn-purple btn-margin"
          type="button"
          onClick={loadStock}
          disabled={isSaving}
        >
          Herladen
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}