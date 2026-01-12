export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxCeZz1P4NoCy-oWbWnWiIJ-G201bVA7TR-uu8-edqJsl7QEPIQCaPA4qCqYCO8PFBfNg/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("Failed to push order:", err);
    res.status(500).json({ error: err.message });
  }
}
