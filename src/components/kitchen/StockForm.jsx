import { useState, useEffect } from "react";

export default function StockForm() {
  const [stockItems, setStockItems] = useState([]);
  const [message, setMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // 🔹 Gebruik nu de Vercel proxy in plaats van direct GAS URL
  const PROXY_URL = "/api/stock";

  // 1️⃣ Haal stock dynamisch op bij component mount
  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch(PROXY_URL);
        const data = await res.json(); // nu veilig JSON
        setStockItems(data);
      } catch (err) {
        console.error(err);
        setMessage("Failed to fetch stock");
      }
    }
    fetchStock();
  }, []);

  const handleChange = (id, value) => {
    setStockItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: value } : item)),
    );
    setIsDirty(true); // er is nu een verandering
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Updating...");

    try {
      const dataToSend = stockItems.map((item) => ({
        ...item,
        stock: item.stock === "" ? 0 : Number(item.stock),
      }));

      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const text = await res.text();
      setMessage(text);

      setIsDirty(false); // knop weer disabled
    } catch (err) {
      console.error(err);
      setMessage("Error updating stock");
    }
  };

  if (!stockItems || !stockItems.length)
    return (
      <div className="center margin">
        <p className="loader"></p>
        <p>Loading stock</p>
      </div>
    );

  return (
    <div className="form">
      <h2>Voorraad</h2>
      <p>
        Controleer eerst de voorraad, zodat we zeker weten dat er niets besteld
        wordt dat niet beschikbaar is.
      </p>

      <form onSubmit={handleSubmit}>
        {stockItems.map((item) => (
          <div key={item.id}>
            <label>
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
        <button className="btn-purple" type="submit" disabled={!isDirty}>
          Update Stock
        </button>
      </form>
      <p>{message}</p>
      <p>Als de voorraad correct is, kan je de keuken starten.</p>
    </div>
  );
}
