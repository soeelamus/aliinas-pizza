import { useEffect, useMemo, useState } from "react";
import Loading from "../Loading/Loading";

export default function StockForm() {
  const [stockItems, setStockItems] = useState([]);
  const [message, setMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState(""); // "api" | "local"

  const API_URL = "/api/stock";
  const LOCAL_URL = "/json/stock.json";

  // ---------- helpers ----------
  const normalizeStockArray = (data) => {
    if (!Array.isArray(data)) return [];
    return data
      .filter((x) => x && (x.id !== undefined || x.name))
      .map((x) => ({
        id: String(x.id ?? x.name ?? ""),
        name: x.name ?? "",
        stock: x.stock ?? 0,
      }));
  };

  const fetchJsonStrict = async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();

    // Als /api niet bestaat krijg je vaak HTML -> content-type text/html
    if (!ct.includes("application/json")) {
      throw new Error(
        `Expected JSON from ${url}, got ${ct}: ${text.slice(0, 80)}`,
      );
    }

    const json = JSON.parse(text);

    // Als jouw API ooit { ok:false } terugstuurt, behandel dat ook als error
    if (json && typeof json === "object" && json.ok === false) {
      throw new Error(json.error || "API returned ok:false");
    }

    return json;
  };

  const fetchStockWithFallback = async () => {
    // 1) probeer API
    try {
      const apiData = await fetchJsonStrict(API_URL);
      setSource("api");
      return normalizeStockArray(apiData);
    } catch (e1) {
      // 2) fallback naar local file
      const res = await fetch(LOCAL_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("Local stock.json not found in /public");
      const localData = await res.json();
      setSource("local");
      return normalizeStockArray(localData);
    }
  };

  // ---------- initial load ----------
  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const items = await fetchStockWithFallback();
        if (!mounted) return;
        setStockItems(items);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setMessage("Failed to fetch stock (API en local fallback faalden).");
        setStockItems([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- change handlers ----------
  const handleChange = (id, value) => {
    setStockItems((prev) =>
      prev.map((item) =>
        String(item.id) === String(id) ? { ...item, stock: value } : item,
      ),
    );
    setIsDirty(true);
  };

  // ---------- submit ----------
  const canSubmit = useMemo(() => {
    // Alleen zinvol als je via API werkt; lokaal kan je niet wegschrijven.
    return isDirty && source === "api";
  }, [isDirty, source]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (source !== "api") {
      setMessage(
        "Je draait zonder server: voorraad kan niet opgeslagen worden. (Je ziet nu de local stock.json.)",
      );
      return;
    }

    setMessage("Updating...");

    try {
      const dataToSend = stockItems.map((item) => ({
        ...item,
        stock: item.stock === "" ? 0 : Number(item.stock),
      }));

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      // jouw nieuwe api/stock.js geeft JSON terug
      const result = await res.json();

      if (!res.ok || result?.ok === false) {
        setMessage(
          `Error updating stock: ${result?.message || result?.error || "unknown"}`,
        );
        return;
      }

      setMessage(result?.message || "Stock updated!");
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      setMessage(
        "Error updating stock. (Waarschijnlijk draait /api/stock niet lokaal.)",
      );
    }
  };

  // ---------- UI states ----------
  if (isLoading) return <Loading innerHTML={"Loading stock"} />;

  if (!stockItems || !stockItems.length) {
    return (
      <div className="kitchen-section form">
        <h1 className="monoton-regular white">Voorraad</h1>
        <p>{message || "Geen stock items gevonden."}</p>
      </div>
    );
  }

  return (
    <div className="kitchen-section form">
      <h1 className="monoton-regular white">Voorraad</h1>
      <form onSubmit={handleSubmit}>
        {stockItems.map((item) => (
          <div key={item.id}>
            <label className="form-text">
              {item.name}:{" "}
              <input
                type="number"
                min="0"
                value={item.stock ?? ""}
                onChange={(e) => handleChange(item.id, e.target.value)}
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
          Update
        </button>
      </form>

      <p>{message}</p>
    </div>
  );
}
