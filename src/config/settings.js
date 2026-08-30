export const DEFAULT_SETTINGS = {
  pricing: {
    menuUpsell: 2, // Price for a menu. (pizza + drink)
    menuDiscount: 0.5, // Discount relative to the price of the pizza + drink
  },

  stock: {
    doughReserveOnline: 10, // Online ordering halts when doughballs stock = 10
  },

  menu: {
    menuName: "Menu", // Name of the Menu component
    categoryOrder: [
      "Menu",
      "Pizza",
      "Drank",
      "Dessert",
      "Energy",
      "Bier",
      "Extra",
    ],
  },

  ordering: {
    slotsInterval: 10, // Interval of ordering timeslot
    maxPerTimeslot: 1, // Max. amount of orders per timeslot
    spareTime: 20 // The minimum amount of preptime to select a timeslot
  },
};
