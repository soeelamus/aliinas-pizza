import React from "react";

const images = Object.values(
  import.meta.glob("/src/assets/ImagesPage/*.{png,jpg,jpeg,svg}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
);

const ImagesPage = () => (
  <div className="images-container">
    <section className="images-box">
      {images.map((img, index) => (
        <img
          key={index}
          className="images-box--img"
          loading="lazy"
          src={img}
          alt={`Pizza sfeerbeeld ${index + 1}`}
        />
      ))}
    </section>
  </div>
);

export default ImagesPage;
