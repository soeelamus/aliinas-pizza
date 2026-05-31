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
import ProtectedRoute from "./components/ProtectedRoute";
import Wave from "./components/Wave";

// Pages
import PaymentPage from "./components/pages/PaymentPage/PaymentPage";
import SuccessPage from "./components/pages/SuccessPage/SuccessPage";
import CareersPage from "./components/pages/CareersPage/CareersPage";
import CareerDetailPage from "./components/pages/CareersPage/CareerDetailPage";

// Employees
import EmployeesLogin from "./components/employees/EmployeesLogin";
import EmployeesDashboard from "./components/employees/EmployeesDashboard";
import EmployeeDetailPage from "./components/employees/EmployeeDetailPage";
import EmployeeCreatePage from "./components/employees/EmployeeCreatePage";
import EmployeePersonalLogin from "./components/employees/EmployeePersonalLogin";
import EmployeeProtectedRoute from "./components/employees/EmployeeProtectedRoute";

// Kitchen components
import KitchenLogin from "./components/kitchen/KitchenLogin";
import KitchenDashboard from "./components/kitchen/KitchenDashboard";

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
            path="/careers"
            element={
              <>
                <Navbar onMain={false} />
                <Wave />
                <CareersPage />
                <Footer />
              </>
            }
          />

          <Route
            path="/careers/:jobId"
            element={
              <>
                <Navbar onMain={false} />
                <Wave />
                <CareerDetailPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/employees/login"
            element={
              <>
                <Navbar onMain={false} />
                <Wave />
                <EmployeesLogin />
              </>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute
                storageKey="employeesAuth"
                redirectTo="/employees/login"
              >
                <Wave />
                <EmployeesDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees/new"
            element={
              <ProtectedRoute
                storageKey="employeesAuth"
                redirectTo="/employees/login"
              >
                <Wave />
                <EmployeeCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees/:employeeId/login"
            element={<EmployeePersonalLogin />}
          />
          <Route
            path="/employees/:employeeId"
            element={
              <EmployeeProtectedRoute>
                <Wave />
                <EmployeeDetailPage />
              </EmployeeProtectedRoute>
            }
          />
        </Route>
        <Route element={<RedirectLayout />}>
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Route>
        {/* 🟣 KITCHEN */}
        <Route
          path="/kitchen/login"
          element={
            <>
              <Wave />
              <KitchenLogin />
            </>
          }
        />{" "}
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
