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

// Pages
import PaymentPage from "./components/pages/PaymentPage/PaymentPage";
import SuccessPage from "./components/pages/SuccessPage/SuccessPage";
import ImagesPage from "./components/pages/ImagesPage/ImagesPage";

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
          <Route path="/employees/login" element={<EmployeesLogin />} />

          <Route
            path="/employees"
            element={
              <ProtectedRoute
                storageKey="employeesAuth"
                redirectTo="/employees/login"
              >
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
