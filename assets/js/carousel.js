async function loadSlides() {
  try {
    const response = await fetch("./assets/json/slides.json");
    const data = await response.json();

    buildSlideshow(data);
    showSlides(slideIndex);
  } catch (err) {
    console.error("Error loading slides.json:", err);
  }
}

function buildSlideshow(data) {
  const slideshow = document.getElementById("slideshow");
  const dotContainer = document.getElementById("dot-container");

  data.forEach((item, index) => {
    // --- Slide wrapper ---
    const slide = document.createElement("div");
    slide.className = "mySlides fade";

    // Number text
    const number = document.createElement("div");
    number.className = "numbertext";
    number.textContent = `${index + 1} / ${data.length}`;

    // Image
    const img = document.createElement("img");
    img.src = item.src;
    img.style.width = "100%";

    // Caption
    const caption = document.createElement("div");
    caption.className = "text-filler";
    caption.textContent = item.caption;
    if (item.offColor) {
      number.style.setProperty("color", item.offColor);
      caption.style.setProperty("color", item.offColor);
    }   


    slide.append(number, img, caption);
    slideshow.appendChild(slide);

    // --- Dot ---
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.addEventListener("click", () => currentSlide(index + 1));
    dotContainer.appendChild(dot);
  });
}

let slideIndex = 1;

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  const slides = document.getElementsByClassName("mySlides");
  const dots = document.getElementsByClassName("dot");

  if (n > slides.length) slideIndex = 1;
  if (n < 1) slideIndex = slides.length;

  // Hide all slides
  Array.from(slides).forEach(slide => slide.style.display = "none");

  // Reset dot states
  Array.from(dots).forEach(dot => {
    dot.classList.remove("active");
  });

  // Show selected slide + activate dot
  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].classList.add("active");
}

window.onload = loadSlides;