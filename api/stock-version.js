export default async function handler(req, res) {
  const GAS_URL = process.env.SHEETS_STOCK;

  res.setHeader("Cache-Control", "no-store");

  try {
    const upstreamRes = await fetch(`${GAS_URL}?meta=1`, { cache: "no-store" });
    const text = await upstreamRes.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = {
        ok: false,
        error: "Invalid JSON from GAS",
        raw: text.slice(0, 200),
      };
    }

    if (json?.ok) {
      console.log(
        "[stock-version]",
        new Date().toISOString(),
        "→",
        json.version,
      );
    } else {
      console.warn("[stock-version] upstream not ok", {
        status: upstreamRes.status,
        snippet: text.slice(0, 120),
      });
    }

    return res.status(upstreamRes.ok ? 200 : 502).json(json);
  } catch (e) {
    console.error("[stock-version] server error", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
