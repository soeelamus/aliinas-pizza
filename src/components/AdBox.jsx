import React, { useState } from "react";

const AdBox = (src) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="adbox">
      {!loaded && <div className="adbox--placeholder" />}

      <a href="#ad" className="adbox--img-box">
        <img
          className="adbox--img"
          src={src.src}
          alt="Combo Deal"
          onLoad={() => setLoaded(true)}
          style={{ display: loaded ? "block" : "none" }}
        />
      </a>
    </div>
  );
};

export default AdBox;