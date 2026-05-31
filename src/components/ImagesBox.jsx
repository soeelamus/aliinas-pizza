const images = [
  "/images/2.png",
  "/images/3.png",
  "/images/4.png",
];
export default function ImagesBox() {
  return (
    <div className="images-container">
      <section className="images-box">
        {images.map((src, index) => (
          <img
            key={src}
            className="images-box--img"
            src={src}
            loading="lazy"
            alt={`Aliina's pizza ${index + 1}`}
          />
        ))}
      </section>
    </div>
  );
}