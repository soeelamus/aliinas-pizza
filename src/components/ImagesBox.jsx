import "../components/pages/ImagesPage/ImagesPage.css";

const images = ["Mood.png", "foodtruck.jpg", "mood-pizza.jpg"];

export default function ImagesBox() {
  return (
    <div className="images-container">
      <section className="images-box">
        {images?.map((img, i) => (
          <img
            key={img}
            className="images-box--img"
            loading="lazy"
            src={new URL(`../assets/ImagesPage/${img}`, import.meta.url).href}
            alt={`Pizza sfeerbeeld ${i}`}
          />
        ))}
      </section>

      <a className="images-box--text link" href="/images">
        Meer foto's
      </a>
    </div>
  );
}