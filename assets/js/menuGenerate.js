fetch("assets/json/data.json")
  .then(response => response.json())
  .then(data => {
    const renderPizzas = () => {
      const html = data.Pizzas.map(pizza => {
        const ingredients = pizza.ingredients.map(i => i.name).join(" • ");       
          return `
          <div class="pizza">
            <div class="img-box">
              <img loading="lazy" class="img-pizza" src="./images/pizzas/${pizza.id}.jpg" alt="Pizza ${pizza.name}" />
            </div>
            <div class="pizza-text">
              <h3 class="pizza-name">${pizza.name}
              <span class="pizza-symbol pizza-spicy">${pizza.type}</span></h3>
              <h3 class="pizza-price">${pizza.price}.- </h3>
            </div>
            <p class="pizza-ingredients">${ingredients}</p>
          </div>
        `;
      });
      document.getElementById("pizza-box").innerHTML = html.join("");
    };
    renderPizzas();
  })
  .catch(error => console.error("Error loading data.json", error));
