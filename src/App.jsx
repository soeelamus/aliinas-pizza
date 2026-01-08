import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import components
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import Carousel from "./components/Carousel";
import Calendar from "./components/Calendar";
import HowWork from "./components/HowWork";
import ContactForm from "./components/ContactForm";
import PizzaShop from './components/PizzaShop';
import Cart from "./components/Cart";
import Footer from "./components/Footer";
import SuccessPage from "./components/SuccessPage"; // nieuwe component

// CSS
import "./assets/css/main.css";
import "leaflet/dist/leaflet.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <>
              <Header />
              <Carousel />
              <Calendar />
              <HowWork />
              <ContactForm />
              <PizzaShop />
              <Cart />
            </>
          } />
          <Route path="/success" element={<SuccessPage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
