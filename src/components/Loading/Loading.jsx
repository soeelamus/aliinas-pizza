import { useEffect, useState } from "react";
import "./Loading.css";

const Loading = ({ innerHTML, margin = "", white = "" }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length === 3) return "";
        return prev + ".";
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className={`center ${margin ? `margin-${margin}` : "margin"}`}>
      <p className="loader"></p>
      <p className={white}>
        <span className="invisible">{dots}</span>
        {innerHTML}
        <span>{dots}</span>
      </p>
    </div>
  );
};

export default Loading;
