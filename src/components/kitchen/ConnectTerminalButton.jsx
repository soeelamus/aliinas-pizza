import React, { useState } from "react";
import {
  initTerminal,
  connectReaderOnce,
} from "../../payments/terminal";

export default function ConnectTerminalButton() {
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState(null);

  const onConnect = async () => {
    setErr(null);
    setStatus("scanning");
    try {
      await initTerminal({ isTest: false });
      await connectReaderOnce();
      setStatus("connected");
    } catch (e) {
      setErr(e?.message || String(e));
      setStatus("error");
    }
  };

  return (
    <div className={{ marginBottom: 12 }}>
      <button
        className="btn-purple"
        onClick={onConnect}
        disabled={status === "scanning" || status === "connected"}
      >
        {status === "connected"
          ? "Terminal verbonden ✅"
          : status === "scanning"
          ? "Zoeken..."
          : "Connect terminal"}
      </button>

      {err && <div style={{ color: "red", marginTop: 6 }}>{err}</div>}
    </div>
  );
}
