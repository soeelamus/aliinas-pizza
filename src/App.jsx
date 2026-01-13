import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages / components
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import Carousel from "./components/Carousel";
import Calendar from "./components/Calendar";
import HowWork from "./components/HowWork";
import ContactForm from "./components/ContactForm";
import ImagesBox from "./components/ImagesBox";
import PizzaShop from "./components/PizzaShop";
import PaymentPage from "./components/PaymentPage";
import SuccessPage from "./components/SuccessPage";
import Footer from "./components/Footer";

// Kitchen components
import KitchenLogin from "./components/kitchen/KitchenLogin";
import KitchenDashboard from "./components/kitchen/KitchenDashboard";
import ProtectedRoute from "./components/kitchen/ProtectedRoute";

// Layouts
import MainLayout from "./layouts//MainLayout";
import RedirectLayout from "./layouts//RedirectLayout";
import KitchenLayout from "./layouts/KitchenLayout";

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
                <Navbar />
                <Header />
                <Carousel />
                <Calendar />
                <HowWork />
                <ContactForm />
                <ImagesBox />
                <PizzaShop />
                <Footer />
              </>
            }
          />
        </Route>

        <Route element={<RedirectLayout />}>
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Route>

        <Route path="/kitchen/login" element={<KitchenLogin />} />

        {/* Protected layout for all /kitchen routes */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute>
              <KitchenLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<KitchenDashboard />} />
          {/* future protected routes */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
