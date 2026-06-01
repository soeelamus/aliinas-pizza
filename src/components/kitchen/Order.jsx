import { useState } from "react";
import { PickupCountdown } from "./PickupCountdown";
import Loading from "../Loading/Loading";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function Order({
  order,
  onStatusChange,
  onOrderDetailsChange,
  updatingId,
  currentTime,
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [nameInput, setNameInput] = useState(order.customername || "");
  const [showTimePopup, setShowTimePopup] = useState(false);
  const [timeInput, setTimeInput] = useState("");
  const [timeError, setTimeError] = useState("");
  const [loading, setLoading] = useState(false);

  const countdown = PickupCountdown(order.pickuptime) || {
    hours: 0,
    minutes: 0,
    pickupTimeFormatted: order.pickuptime || "Onbekend",
    isRed: order.pickuptime === "ASAP",
    isOrange: false,
  };

  const pizzas =
    order.items
      ?.split(",")
      .map((item) => item.trim())
      .map((item) => {
        const match = item.match(/^(\d+)\s*x\s*(.+)$/i);
        return match
          ? { quantity: Number(match[1]), name: match[2].trim() }
          : null;
      })
      .filter(Boolean) || [];

  const handleClick = (newStatus) => onStatusChange(order.id, newStatus);

  const toggle = () => setIsCollapsed((v) => !v);

  const openTimePopup = (e) => {
    e.stopPropagation();
    setNameInput(order.customername || "");
    setTimeInput("");
    setTimeError("");
    setLoading(false);
    setShowTimePopup(true);
  };

  const closeTimePopup = () => {
    if (loading) return;

    setShowTimePopup(false);
    setTimeInput("");
    setTimeError("");
    setLoading(false);
  };

  const validateTime = (newValue) => {
    if (newValue.length !== 4) {
      setTimeError("Geef 4 cijfers in, bv. 1830");
      return false;
    }

    const hours = Number(newValue.slice(0, 2));
    const minutes = Number(newValue.slice(2, 4));

    if (hours > 23 || minutes > 59) {
      setTimeError("Ongeldig uur");
      setTimeInput("");
      return false;
    }

    return true;
  };

  const savePickupTime = async (newValue) => {
    const hours = Number(newValue.slice(0, 2));
    const minutes = Number(newValue.slice(2, 4));

    const formattedTime = `${String(hours).padStart(2, "0")}:${String(
      minutes,
    ).padStart(2, "0")}`;

    await onOrderDetailsChange(order.id, {
      customername: nameInput.trim() || order.customername,
      pickuptime: formattedTime,
    });
  };

  const addTimeDigit = (digit) => {
    if (loading) return;
    if (timeInput.length >= 4) return;

    const newValue = timeInput + digit;

    setTimeInput(newValue);
    setTimeError("");

    if (newValue.length === 4) {
      if (!validateTime(newValue)) return;

      setLoading(true);

      savePickupTime(newValue).catch((err) => {
        console.error(err);
      });

      setTimeout(() => {
        setLoading(false);

        setShowTimePopup(false);
        setTimeInput("");
        setTimeError("");
      }, 1000);
    }
  };

  const removeTimeDigit = () => {
    if (loading) return;
    setTimeInput((prev) => prev.slice(0, -1));
  };

  return (
    <li
      className={`kitchen-order
        ${order.status === "done" ? "done" : ""}
        ${order.status === "pickedup" ? "pickedup" : ""}
        ${countdown.isRed && order.status === "new" ? "urgent-red" : ""}
        ${countdown.isOrange && order.status === "new" ? "urgent-orange" : ""}
      `}
    >
      <div
        className="heading-box"
        onClick={toggle}
        style={{ cursor: "pointer" }}
      >
        <ul className="heading">
          <li>{order.customername?.toUpperCase() || "Onbekend"}</li>

          <li onClick={(e) => e.stopPropagation()}>
            <strong className={order.pickuptime === "ASAP" ? "urgent-red" : ""}>
              {countdown.pickupTimeFormatted}
            </strong>
          </li>

          {order.status !== "pickedup" && order.pickuptime !== "ASAP" && (
            <li>
              {`${countdown.hours.toString().padStart(2, "0")}:${countdown.minutes
                .toString()
                .padStart(2, "0")}`}
            </li>
          )}
        </ul>
      </div>

      <div
        className="orders--info"
        style={{ display: isCollapsed ? "block" : "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        {pizzas.map((pizza, i) => (
          <div className="pizzas" key={i}>
            <label className="pizza-item">
              <input type="checkbox" onClick={(e) => e.stopPropagation()} />
              <span className="pizza-qty">{pizza.quantity}x</span>
              <span className="pizza-name">{pizza.name}</span>
            </label>
          </div>
        ))}

        {order.customernotes && (
          <span className="pizzas list">Notes: {order.customernotes}</span>
        )}

        <div className="kitchen-orders--actions">
          {order.status === "new" && (
            <button
              className="btn-purple"
              onClick={(e) => {
                e.stopPropagation();
                handleClick("done");
              }}
              disabled={updatingId === order.id}
            >
              {updatingId === order.id ? "Updating..." : "Done"}
            </button>
          )}

          {order.status === "done" && (
            <button
              className="btn-purple"
              onClick={(e) => {
                e.stopPropagation();
                handleClick("pickedup");
              }}
              disabled={updatingId === order.id}
            >
              {updatingId === order.id ? "Updating..." : "Pick-up"}
            </button>
          )}

          {order.status !== "pickedup" && (
            <button
              type="button"
              className="btn-purple btn-small"
              onClick={openTimePopup}
              disabled={updatingId === order.id}
              style={{ marginLeft: "0.5rem" }}
            >
              ⚙
            </button>
          )}
        </div>
      </div>

      {showTimePopup && (
        <div className="order-edit-overlay" onClick={closeTimePopup}>
          <div
            className="order-edit-popup"
            onClick={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className="checkout-loading-overlay">
                <Loading innerHTML={"Order wordt aangepast"} />
              </div>
            ) : (
              <>
                <h1>Order aanpassen</h1>

                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onFocus={() => {
                    if (nameInput) setNameInput("");
                  }}
                  placeholder="Naam klant"
                  className="order-edit-input"
                />

                <div className="order-time-display">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} className="order-time-digit">
                      {timeInput[i] || "○"}
                    </span>
                  ))}
                </div>

                <div className="order-keypad">
                  {KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="btn-purple order-key"
                      onClick={() => addTimeDigit(key)}
                    >
                      {key}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="btn-purple order-key"
                    onClick={() => setTimeInput("")}
                  >
                    C
                  </button>

                  <button
                    type="button"
                    className="btn-purple order-key"
                    onClick={() => addTimeDigit("0")}
                  >
                    0
                  </button>

                  <button
                    type="button"
                    className="btn-purple order-key"
                    onClick={removeTimeDigit}
                  >
                    ⌫
                  </button>
                </div>

                {timeError && <p className="order-edit-error">{timeError}</p>}

                <div className="order-edit-actions">
                  <button
                    type="button"
                    className="btn-purple order-key"
                    onClick={closeTimePopup}
                  >
                    Sluiten
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
