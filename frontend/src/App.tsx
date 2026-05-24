import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// * Stylos
//? futuro separar los estilos
import "./styles/global.css";
import "./styles/index.scss";

// * pagina "shop"
import Products from "./pages/shop/Products";
import Cart from "./pages/shop/Cart";
import Booking from "./pages/shop/Booking";

// * paginas "public"
import Services from "./pages/public/Services";
import Gallery from "./pages/public/Gallery";
import Home from "./pages/public/Home";

// * pagina "client"
import ClientPanel from "./pages/client/ClientPanel";

// * paginas "auth"
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";

// * paginas  "admin"
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminLogin from "./pages/admin/AdminLogin";

// * layouts
import { MainLayout } from "./layout/MainLayout";

// todo: ver si cambio el formato de esto
// todo: hay un formato mas llamativo

// ? manito @yallico aqui esta tu codigo anterior si no te gusta el nuevo solo cambialo todo de chill
/* 
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/client/panel" element={<ClientPanel />} />
            <Route path="/admin/calendar" element={<AdminCalendar />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/tasks" element={<AdminTasks />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
};

export default App;
*/

// * si alguien pregunta fue echo con IA son las 1a.m estoy cansado
export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // --- Rutas Generales ---
      { path: "", element: <Home /> }, // También puedes usar { index: true, element: <Home /> }
      { path: "services", element: <Services /> },
      { path: "products", element: <Products /> },
      { path: "cart", element: <Cart /> },
      { path: "booking", element: <Booking /> },
      { path: "gallery", element: <Gallery /> },

      // --- Autenticación ---
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },

      // --- Panel de Cliente ---
      { path: "client/panel", element: <ClientPanel /> },

      // --- Rutas de Administrador ---
      {
        path: "admin",
        children: [
          { path: "login", element: <AdminLogin /> },
          { path: "calendar", element: <AdminCalendar /> },
          { path: "inventory", element: <AdminInventory /> },
          { path: "tasks", element: <AdminTasks /> },
        ],
      },
    ],
  },
]);
function App() {
  return <RouterProvider router={router} />;
}

export default App;
