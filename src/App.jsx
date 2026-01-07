import React from "react";

// Import Compontents
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import Carousel from "./components/Carousel";
import Calendar from "./components/Calendar";
import HowWork from "./components/HowWork";
import ContactForm from "./components/ContactForm";
import PizzaShop from './components/PizzaShop';
import Cart from "./components/Cart";

// Import CSS
import Footer from "./components/Footer";
import "./assets/css/main.css";
import "leaflet/dist/leaflet.css";


function App() {
    return (
    <div className="App">
      <Navbar />
      <Header />
      <Carousel />
      <Calendar />
      <HowWork />
      <ContactForm />
      <PizzaShop />
      <Cart />
      <Footer />
    </div>
  );
}

export default App
