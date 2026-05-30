export default function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const { pin } = req.body || {};

    const realPin = process.env.EMPLOYEES_PIN;
    const apiToken = process.env.API_TOKEN;

    if (!realPin) {
      return res.status(500).json({
        success: false,
        error: "EMPLOYEES_PIN not set",
      });
    }

    if (!apiToken) {
      return res.status(500).json({
        success: false,
        error: "API_TOKEN not set",
      });
    }

    if (String(pin) === String(realPin)) {
      res.setHeader(
        "Set-Cookie",
        `employeesAuth=${apiToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
      );

      return res.status(200).json({
        success: true,
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid pin",
    });
  } catch (err) {
    console.error("[employees-login]", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Server error",
    });
  }
}