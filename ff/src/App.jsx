import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminSidebar from './components/AdminSidebar';
import AdminNavbar from './components/AdminNavbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/public/Home';
import Events from './pages/public/Events';
import EventDetails from './pages/public/EventDetails';
import Packages from './pages/public/Packages';
import Order from './pages/public/Order';
import Contact from './pages/public/Contact';
import Shop from './pages/public/Shop';

import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ManageCategories from './pages/admin/ManageCategories';
import ManageEvents from './pages/admin/ManageEvents';
import ManagePackages from './pages/admin/ManagePackages';
import ManageOrders from './pages/admin/ManageOrders';
import UploadMedia from './pages/admin/UploadMedia';
import Settings from './pages/admin/Settings';
import WhatsAppSetup from './pages/admin/WhatsAppSetup';
import ManageProductCategories from './pages/admin/ManageProductCategories';
import ManageProducts from './pages/admin/ManageProducts';
import ManageProductOrders from './pages/admin/ManageProductOrders';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<Login />} />

          <Route path="/admin/*" element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-gray-50">
                <AdminSidebar />
                <div className="flex-1">
                  <AdminNavbar />
                  <main className="p-6">
                    <Routes>
                      <Route index element={<Dashboard />} />
                      <Route path="categories" element={<ManageCategories />} />
                      <Route path="events" element={<ManageEvents />} />
                      <Route path="packages" element={<ManagePackages />} />
                      <Route path="orders" element={<ManageOrders />} />
                      <Route path="product-categories" element={<ManageProductCategories />} />
                      <Route path="products" element={<ManageProducts />} />
                      <Route path="product-orders" element={<ManageProductOrders />} />
                      <Route path="upload" element={<UploadMedia />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="whatsapp" element={<WhatsAppSetup />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />

          <Route path="*" element={
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:id" element={<EventDetails />} />
                  <Route path="/packages" element={<Packages />} />
                  <Route path="/order" element={<Order />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/shop" element={<Shop />} />
                </Routes>
              </main>
              <Footer />
            </div>
          } />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false}
          newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover
          theme="light" />
      </AuthProvider>
    </BrowserRouter>
  );
}
