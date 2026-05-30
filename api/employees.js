export default async function handler(req, res) {
  const GAS_URL = process.env.SHEETS_EMPLOYEES;

  res.setHeader("Cache-Control", "no-store");

  if (!GAS_URL) {
    return res.status(500).json({
      ok: false,
      error: "Missing SHEETS_EMPLOYEES env variable",
    });
  }

  const cookies = req.headers.cookie || "";
  const hasEmployeesAuth = cookies.includes(
    `employeesAuth=${process.env.API_TOKEN}`
  );

  const isEmployeeLogin =
    req.method === "POST" && req.body?.action === "employeeLogin";

  if (!hasEmployeesAuth && !isEmployeeLogin) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
    });
  }

  try {
    if (req.method === "GET") {
      const query = new URLSearchParams(req.query).toString();
      const url = query ? `${GAS_URL}?${query}` : GAS_URL;

      const upstreamRes = await fetch(url, {
        cache: "no-store",
      });

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

      return res.status(upstreamRes.ok ? 200 : 502).json(json);
    }

    if (req.method === "POST") {
      const upstreamRes = await fetch(GAS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(req.body),
      });

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

      return res.status(upstreamRes.ok ? 200 : 502).json(json);
    }

    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  } catch (e) {
    console.error("[employees] server error", e);

    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
}