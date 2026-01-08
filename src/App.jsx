import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages / components
import Header from "./components/Header";
import Carousel from "./components/Carousel";
import Calendar from "./components/Calendar";
import HowWork from "./components/HowWork";
import ContactForm from "./components/ContactForm";
import ImagesBox from "./components/ImagesBox";
import PizzaShop from "./components/PizzaShop";
import Cart from "./components/Cart";
import SuccessPage from "./components/SuccessPage";

// Layouts
import MainLayout from "./layouts//MainLayout";
import RedirectLayout from "./layouts//RedirectLayout";

// CSS
import "./assets/css/main.css";
import "leaflet/dist/leaflet.css";

function App() {
  return (
    <Router>
      <Routes>

        {/* 🟣 MAIN WEBSITE */}
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              <>
                <Header />
                <Carousel />
                <Calendar />
                <HowWork />
                <ContactForm />
                <ImagesBox />
                <PizzaShop />
                <Cart />
              </>
            }
          />
        </Route>

        <Route element={<RedirectLayout />}>
          <Route 
            path="/success" 
            element={<SuccessPage />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
