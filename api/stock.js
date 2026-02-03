// /api/stock.js
export default async function handler(req, res) {
  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbwWXO257hSAM3xViRi4uF-wZvfvQ3KEs4oR2Hf8SKeIav0OX3yokPDmOqN69ySy9hF7/exec";

  // CORS (handig als je ooit extern aanroept)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Kleine helper: maak van upstream response altijd { ok, status, contentType, text, json? }
  async function readUpstreamResponse(upstreamRes) {
    const status = upstreamRes.status;
    const ok = upstreamRes.ok;
    const contentType = upstreamRes.headers.get("content-type") || "";
    const text = await upstreamRes.text();

    // Probeer JSON te parsen, ongeacht content-type (GAS is soms inconsistent)
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // json blijft null
    }

    return { ok, status, contentType, text, json };
  }

  try {
    const { type } = req.query ?? {};

    // =========================
    // GET
    // =========================
    if (req.method === "GET") {
      const url = type
        ? `${GAS_URL}?type=${encodeURIComponent(String(type))}`
        : GAS_URL;

      const upstreamRes = await fetch(url);
      const upstream = await readUpstreamResponse(upstreamRes);

      // Upstream faalt (4xx/5xx)
      if (!upstream.ok) {
        return res.status(502).json({
          ok: false,
          error: "Upstream request failed",
          upstreamStatus: upstream.status,
          upstreamContentType: upstream.contentType,
          upstreamJson: upstream.json, // als parse lukt
          upstreamSnippet: upstream.text.slice(0, 200),
        });
      }

      // Upstream is ok maar geen JSON kunnen parsen
      if (upstream.json === null) {
        return res.status(502).json({
          ok: false,
          error: "Upstream did not return valid JSON",
          upstreamStatus: upstream.status,
          upstreamContentType: upstream.contentType,
          upstreamSnippet: upstream.text.slice(0, 200),
        });
      }

      // Alles ok
      return res.status(200).json(upstream.json);
    }

    // =========================
    // POST
    // =========================
    if (req.method === "POST") {
      // In sommige setups kan req.body string zijn; proberen te normaliseren:
      let bodyToSend = req.body;

      // Als body string is, probeer JSON te parsen
      if (typeof bodyToSend === "string") {
        try {
          bodyToSend = JSON.parse(bodyToSend);
        } catch {
          // laat het string, GAS kan ermee falen -> dan vangen we dat af
        }
      }

      const upstreamRes = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend ?? []),
      });

      const upstream = await readUpstreamResponse(upstreamRes);

      // POST: we geven altijd JSON terug naar client (consistent)
      return res.status(upstream.ok ? 200 : 502).json({
        ok: upstream.ok,
        upstreamStatus: upstream.status,
        upstreamContentType: upstream.contentType,
        // Als upstream JSON terugstuurt, geef die mee, anders message/snippet
        data: upstream.json,
        message: upstream.json === null ? upstream.text : undefined,
      });
    }

    // =========================
    // Unsupported method
    // =========================
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
      allowed: ["GET", "POST", "OPTIONS"],
    });
  } catch (err) {
    console.error("API /stock error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
}
