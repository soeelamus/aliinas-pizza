// src/data/seoPages.js

const IMAGE = "/images/2.png";

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const createPizzaPage = (location) => ({
  slug: `pizza-${slugify(location)}`,
  priority: "0.9",
  type: "pizza",
  location,
  badge: `Pizza in ${location}`,
  h1: `Pizza ${location}`,
  title: `Pizza ${location} | Verse Napolitaanse Pizza | Aliina's`,
  description: `Op zoek naar verse pizza in ${location}? Aliina's bakt verse Napolitaanse pizza's met dagelijks vers deeg en kwaliteitsvolle ingrediënten.`,
  intro: `Zin in verse Napolitaanse pizza in ${location}? Aliina's maakt pizza's met dagelijks vers deeg, verse groenten, mozzarella en zorgvuldig gekozen toppings.`,
  image: IMAGE,
  imageAlt: `Verse Napolitaanse pizza van Aliina's in ${location}`,
  ctaText: "Bestel pizza",
  ctaLink: "/ordering",
  secondaryCtaText: "Naar homepage",
  secondaryCtaLink: "/",
  sections: [
    {
      title: `Verse pizza in ${location}`,
      text: `Aliina's brengt verse Napolitaanse pizza naar ${location}. Onze pizza's worden gebakken op hoge temperatuur met een luchtige korst en volle smaak.`,
    },
    {
      title: "Afhalen of op locatie",
      text: "Je kan langskomen op onze vaste standplaatsen of Aliina's boeken voor privéfeesten, communies, huwelijken en bedrijfsevents.",
    },
    {
      title: "Dagelijks vers deeg",
      text: "We bereiden ons deeg dagelijks vers en werken met kwaliteitsvolle ingrediënten, verse groenten, mozzarella en zorgvuldig geselecteerd vlees.",
    },
  ],
  keywords: [
    `pizza ${location}`,
    `pizza afhalen ${location}`,
    `Napolitaanse pizza ${location}`,
    `pizza foodtruck ${location}`,
  ],
  faq: [
    {
      question: `Waar kan ik Aliina's vinden in ${location}?`,
      answer: `Bekijk onze kalender voor de actuele standplaatsen en openingsuren in ${location} en omgeving.`,
    },
    {
      question: "Kan ik pizza online bestellen?",
      answer: "Ja, op openingsdagen kan je makkelijk bestellen via onze bestelpagina.",
    },
  ],
});

const createFoodtruckPage = (location) => ({
  slug: `pizza-foodtruck-${slugify(location)}`,
  priority: "0.9",
  type: "foodtruck",
  location,
  badge: `Foodtruck ${location}`,
  h1: `Pizza Foodtruck ${location}`,
  title: `Pizza Foodtruck ${location} | Aliina's`,
  description: `Pizza foodtruck huren in ${location}? Aliina's verzorgt verse Napolitaanse pizza's voor feesten, communies, huwelijken en bedrijfsevents.`,
  intro: `Op zoek naar een pizza foodtruck in ${location}? Aliina's komt langs met verse Napolitaanse pizza's voor jouw feest of evenement.`,
  image: IMAGE,
  imageAlt: `Pizza foodtruck van Aliina's in ${location}`,
  ctaText: "Vraag offerte aan",
  ctaLink: "/contact",
  secondaryCtaText: "Naar homepage",
  secondaryCtaLink: "/",
  sections: [
    {
      title: `Foodtruck huren in ${location}`,
      text: `Aliina's verzorgt pizza catering in ${location} voor feesten, communies, huwelijken, verjaardagen en bedrijfsevents.`,
    },
    {
      title: "Verse pizza's op locatie",
      text: "We bakken verse Napolitaanse pizza's ter plaatse voor jouw gasten.",
    },
    {
      title: "Catering zonder zorgen",
      text: "Jij ontvangt je gasten, wij zorgen voor de pizza's. Zo blijft je feest gezellig en eenvoudig georganiseerd.",
    },
  ],
  keywords: [
    `pizza foodtruck ${location}`,
    `foodtruck ${location}`,
    `foodtruck huren ${location}`,
    `pizza catering ${location}`,
  ],
  faq: [
    {
      question: `Komt Aliina's naar ${location}?`,
      answer: `Ja, Aliina's is beschikbaar voor feesten en evenementen in ${location} en omgeving.`,
    },
    {
      question: "Voor welke events kan ik jullie boeken?",
      answer: "Voor privéfeesten, communies, huwelijken, verjaardagen, bedrijfsfeesten en andere evenementen.",
    },
  ],
});

const pizzaLocations = [
  "Lochristi",
  "Desteldonk",
  "Lokeren",
  "Gent",
  "Zelzate",
  "Zaffelare",
  "Wachtebeke",
  "Zeveneken",
  "Beervelde",
  "Moerbeke",
  "Sint-Niklaas"
];

const generalPages = [
  {
    slug: "foodtruck-huren-oost-vlaanderen",
    priority: "1.0",
    type: "foodtruck",
    location: "Oost-Vlaanderen",
    badge: "Foodtruck Oost-Vlaanderen",
    h1: "Foodtruck Huren Oost-Vlaanderen",
    title: "Foodtruck Huren Oost-Vlaanderen | Pizza Foodtruck Aliina's",
    description:
      "Foodtruck huren in Oost-Vlaanderen? Aliina's verzorgt verse Napolitaanse pizza's voor privéfeesten, communies, huwelijken en bedrijfsevents.",
    intro:
      "Wil je een foodtruck huren in Oost-Vlaanderen? Aliina's komt langs met verse Napolitaanse pizza's voor een gezellig en smaakvol event.",
    image: IMAGE,
    imageAlt: "Aliina's pizza foodtruck voor evenementen in Oost-Vlaanderen",
    ctaText: "Vraag offerte aan",
    ctaLink: "/contact",
    secondaryCtaText: "Naar homepage",
    secondaryCtaLink: "/",
    sections: [
      {
        title: "Pizza foodtruck voor events",
        text: "Aliina's is ideaal voor communies, huwelijken, verjaardagen, bedrijfsevents, buurtfeesten en privéfeesten.",
      },
      {
        title: "Actief in Oost-Vlaanderen",
        text: "We zijn actief in onder andere Lochristi, Desteldonk, Gent, Lokeren, Zelzate, Zaffelare en Wachtebeke.",
      },
      {
        title: "Vers gebakken pizza's",
        text: "Onze pizza's worden ter plaatse gebakken met vers deeg, kwaliteitsvolle mozzarella en verse toppings.",
      },
    ],
    keywords: [
      "foodtruck huren Oost-Vlaanderen",
      "pizza foodtruck Oost-Vlaanderen",
      "pizza catering Oost-Vlaanderen",
      "foodtruck huwelijk Oost-Vlaanderen",
      "foodtruck communie Oost-Vlaanderen",
    ],
    faq: [
      {
        question: "In welke regio komt Aliina's langs?",
        answer:
          "Aliina's is actief in Oost-Vlaanderen, waaronder Lochristi, Gent, Lokeren, Zelzate, Desteldonk, Zaffelare en Wachtebeke.",
      },
      {
        question: "Kan ik jullie boeken voor een bedrijfsevent?",
        answer:
          "Ja, Aliina's kan geboekt worden voor bedrijfsevents, personeelsfeesten en andere zakelijke evenementen.",
      },
    ],
  },
  {
    slug: "pizza-catering-oost-vlaanderen",
    priority: "1.0",
    type: "catering",
    location: "Oost-Vlaanderen",
    badge: "Pizza Catering",
    h1: "Pizza Catering Oost-Vlaanderen",
    title: "Pizza Catering Oost-Vlaanderen | Aliina's",
    description:
      "Pizza catering in Oost-Vlaanderen? Aliina's bakt verse Napolitaanse pizza's op locatie voor feesten, communies, huwelijken en bedrijfsevents.",
    intro:
      "Zoek je originele pizza catering in Oost-Vlaanderen? Aliina's bakt verse Napolitaanse pizza's op locatie voor jouw gasten.",
    image: IMAGE,
    imageAlt: "Pizza catering van Aliina's in Oost-Vlaanderen",
    ctaText: "Vraag offerte aan",
    ctaLink: "/contact",
    secondaryCtaText: "Naar homepage",
    secondaryCtaLink: "/",
    sections: [
      {
        title: "Pizza catering voor jouw feest",
        text: "Wij verzorgen pizza catering voor privéfeesten, communies, huwelijken, verjaardagen en bedrijfsevents.",
      },
      {
        title: "Vers gebakken op locatie",
        text: "Onze pizza's worden ter plaatse gebakken, zodat je gasten kunnen genieten van warme, verse Napolitaanse pizza.",
      },
      {
        title: "Actief in Oost-Vlaanderen",
        text: "Aliina's komt langs in onder andere Lochristi, Gent, Lokeren, Zelzate, Desteldonk en omliggende gemeenten.",
      },
    ],
    keywords: [
      "pizza catering Oost-Vlaanderen",
      "pizza catering feest",
      "pizza catering huwelijk",
      "pizza catering communie",
      "Napolitaanse pizza catering",
    ],
    faq: [
      {
        question: "Voor welke feesten is pizza catering geschikt?",
        answer:
          "Pizza catering is geschikt voor communies, huwelijken, verjaardagen, bedrijfsevents, buurtfeesten en privéfeesten.",
      },
      {
        question: "Bakken jullie de pizza's ter plaatse?",
        answer:
          "Ja, wij bakken de pizza's vers op locatie aan onze foodtruck.",
      },
    ],
  },
  {
    slug: "napolitaanse-pizza-oost-vlaanderen",
    priority: "0.9",
    type: "pizza",
    location: "Oost-Vlaanderen",
    badge: "Napolitaanse Pizza",
    h1: "Napolitaanse Pizza Oost-Vlaanderen",
    title: "Napolitaanse Pizza Oost-Vlaanderen | Aliina's",
    description:
      "Zin in Napolitaanse pizza in Oost-Vlaanderen? Aliina's maakt verse pizza's met dagelijks vers deeg en kwaliteitsvolle ingrediënten.",
    intro:
      "Aliina's brengt Napolitaanse pizza naar Oost-Vlaanderen. Vers deeg, een luchtige korst en zorgvuldig gekozen toppings staan centraal.",
    image: IMAGE,
    imageAlt: "Napolitaanse pizza van Aliina's in Oost-Vlaanderen",
    ctaText: "Bestel pizza",
    ctaLink: "/ordering",
    secondaryCtaText: "Naar homepage",
    secondaryCtaLink: "/",
    sections: [
      {
        title: "Verse Napolitaanse pizza",
        text: "Onze pizza's worden gebakken op hoge temperatuur voor een luchtige korst en volle smaak.",
      },
      {
        title: "Dagelijks vers deeg",
        text: "We bereiden ons deeg dagelijks vers en werken met kwaliteitsvolle ingrediënten, verse groenten en mozzarella.",
      },
      {
        title: "Afhalen of boeken",
        text: "Kom langs op onze vaste standplaatsen of boek Aliina's als pizza foodtruck voor jouw event.",
      },
    ],
    keywords: [
      "Napolitaanse pizza Oost-Vlaanderen",
      "verse pizza Oost-Vlaanderen",
      "pizza foodtruck Oost-Vlaanderen",
      "pizza afhalen Oost-Vlaanderen",
    ],
    faq: [
      {
        question: "Wat maakt jullie pizza Napolitaans?",
        answer:
          "Onze pizza's worden gebakken op hoge temperatuur en hebben een luchtige korst, verse toppings en een volle smaak.",
      },
      {
        question: "Waar kan ik Aliina's vinden?",
        answer:
          "Bekijk onze kalender voor de actuele standplaatsen en openingsuren.",
      },
    ],
  },
];

export const seoPages = [
  ...pizzaLocations.map(createPizzaPage),
  ...pizzaLocations.map(createFoodtruckPage),
  ...generalPages,
];