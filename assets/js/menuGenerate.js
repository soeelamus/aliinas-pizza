// Load JSON and use it
fetch("assets/json/data.json")
  .then(response => response.json())
  .then(data => {
    const pizzas = data.Pizzas;

    // --- 1. Build filter buttons dynamically ---
    const typeSymbolMap = {
      veggie: "🥬",
      classic: "⭐",
      pikant: "🌶️"
    };
    const allTypes = new Set();
    pizzas.forEach(pizza => pizza.types.forEach(t => allTypes.add(t.name)));
    const filterContainer = document.getElementById("pizza-filter"); // add a div with this id in HTML
    filterContainer.innerHTML = `<button class="btn-purple btn-wider" data-type="all">Alles</button>` + 
      Array.from(allTypes).map(type => `<button class="btn-purple btn-wider" data-type="${type}">${type} ${typeSymbolMap[type] || ""}</button>`).join("");


    // --- 2. Render pizzas ---
    const renderPizzas = (filterType = "all") => {
      const filtered = filterType === "all"
        ? pizzas
        : pizzas.filter(p => p.types.some(t => t.name === filterType));

      const blocks = filtered.map(pizza => {
        const ingredients = pizza.ingredients.map(i => i.name).join(" • ");
 const symbols = pizza.types
          .map(t => typeSymbolMap[t.name])
          .filter(Boolean) // remove undefined
          .join(" ");        
          return `
          <div class="pizza">
            <div class="img-box">
              <img loading="lazy" class="img-pizza" src="./images/pizzas/${pizza.id}.jpg" alt="Pizza ${pizza.name}" />
            </div>
            <div class="pizza-text">
              <h3 class="pizza-name">${pizza.name}
              <span class="pizza-symbol pizza-spicy">${symbols}</span></h3>
              <h3 class="pizza-price">${pizza.price}.- </h3>
            </div>
            <p class="pizza-ingredients">${ingredients}</p>
          </div>
        `;
      });

      document.getElementById("pizza-box").innerHTML = blocks.join("");
    };

    // --- 3. Initial render ---
    renderPizzas();

    // --- 4. Add filter click events ---
    document.querySelectorAll("#pizza-filter button").forEach(btn => {
      btn.addEventListener("click", () => {
        renderPizzas(btn.getAttribute("data-type"));
      });
    });

  })
  .catch(error => console.error("Error loading JSON:", error));
