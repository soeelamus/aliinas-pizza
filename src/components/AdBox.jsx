import React, { useEffect, useState } from "react";

const AdBox = () => {
  const [i, setI] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);

    const interval = setInterval(() => {
      setI((prev) => (prev % 3) + 1);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const src = `/images/ads/combo_ad${i}.png`;

  return (
    <div className="adbox">
      {!loaded && <div className="adbox--placeholder" />}

      <a href="#ad" className="adbox--img-box">
        <img
          className="adbox--img"
          src={src}
          alt="Combo Deal"
          onLoad={() => setLoaded(true)}
          style={{ display: loaded ? "block" : "none" }}
        />
      </a>
    </div>
  );
};

export default AdBox;