
// Load JSON and use it
fetch("assets/json/data.json")
  .then(response => response.json())
  .then(data => {
    const pizzas = data.Pizzas;

    // Build HTML blocks dynamically
    const blocks = pizzas.map(pizza => {
      const ingredients = pizza.ingredients
        .map(i => i.name)
        .join(" • ");
        

      return `
        <div class="pizza">
            <div class="img-box">
              <img class="zoom" src="images/${pizza.id}.jpg" alt="Pizza ${pizza.name}" />
            </div>
          <div class="pizza-text">
            <h3 class="pizza-name">${pizza.name}</h3>
            <h3 class="pizza-price">${pizza.price}.-</h3>
            </div>
            <p class="pizza-ingredients">${ingredients}</p>
        </div>
      `;
    });

    document.getElementById("pizza-box").innerHTML = blocks.join("");

  })
  .catch(error => console.error("Error loading JSON:", error));


