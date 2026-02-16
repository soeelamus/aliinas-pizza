import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Components (Main site)
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import Carousel from "./components/Carousel";
import Calendar from "./components/Calendar";
import HowWork from "./components/HowWork";
import ContactForm from "./components/ContactForm";
import ImagesBox from "./components/ImagesBox";
import PizzaShop from "./components/PizzaShop";
import Footer from "./components/Footer";

// Pages
import PaymentPage from "./components/pages/PaymentPage/PaymentPage";
import SuccessPage from "./components/pages/SuccessPage/SuccessPage";
import ImagesPage from "./components/pages/ImagesPage/ImagesPage";

// Kitchen components
import KitchenLogin from "./components/kitchen/KitchenLogin";
import KitchenDashboard from "./components/kitchen/KitchenDashboard";
import ProtectedRoute from "./components/kitchen/ProtectedRoute";

// Layouts
import MainLayout from "./layouts/MainLayout";
import RedirectLayout from "./layouts/RedirectLayout";
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
                <PizzaShop />
                <HowWork />
                <ContactForm />
                <ImagesBox />
                <Calendar />
                <Footer />
              </>
            }
          />
          <Route
            path="/ordering"
            element={
              <>
                <Navbar onMain={false} />
                <PizzaShop />
                <Footer />
              </>
            }
          />
          <Route
            path="/images"
            element={
              <>
                <Navbar onMain={false} />
                <ImagesPage />
                <Footer />
              </>
            }
          />
        </Route>
        <Route element={<RedirectLayout />}>
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Route>

        {/* 🟣 KITCHEN */}
        <Route path="/kitchen/login" element={<KitchenLogin />} />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute>
              <KitchenLayout />
            </ProtectedRoute>
          }
        >
          {/* Default: /kitchen → /kitchen/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<KitchenDashboard />} />

          {/* Catch-all for invalid kitchen routes */}
          <Route path="*" element={<Navigate to="/kitchen/login" replace />} />
        </Route>

        {/* 🔴 GLOBAL FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
