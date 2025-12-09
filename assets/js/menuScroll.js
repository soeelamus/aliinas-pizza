const track = document.querySelector(".track");
const track2 = document.querySelector(".track-2");
const triggerElement = document.getElementById("10"); // element to trigger movement
const speedFactor = 0.4; // control horizontal speed

window.addEventListener("scroll", () => {
  const triggerPoint = triggerElement.offsetTop; // top position of the element
  let scrollAmount = window.scrollY - triggerPoint;

  if (scrollAmount < 0) scrollAmount = 0; // don't move before reaching the element

  const moveX = scrollAmount * speedFactor;
  track.style.transform = `translateX(-${moveX}px)`;
  track2.style.transform = `translateX(+${moveX}px)`;
});

// Load JSON and use it
fetch("assets/json/data.json")
  .then(response => response.json())
  .then(data => {
    const pizzas = data.Pizzas;
    const half = Math.ceil(pizzas.length / 2);

    // Build HTML blocks dynamically
    const blocks = pizzas.map(pizza => {
      const ingredients = pizza.ingredients
        .map(i => i.name)
        .join(" • ");
        

      return `
        <div class="pizza">
          <span class="image">
            <div class="img-box">
              <img class="zoom" src="images/${pizza.id}.jpg" alt="Pizza ${pizza.name}" />
            </div>
          </span>
          <div class="flex">
            <h3>${pizza.name}</h3>
            <h3>${pizza.price}.-</h3>
          </div>
          <p class="ingredients">${ingredients}</p>
        </div>
      `;
    });

    // FIRST HALF → #track
    document.getElementById("track").innerHTML = blocks.slice(0, half).join("");

    // SECOND HALF → #track-2
    document.getElementById("track-2").innerHTML = blocks.slice(half).join("");
  })
  .catch(error => console.error("Error loading JSON:", error));


