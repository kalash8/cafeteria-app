import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import MenuManagement from './pages/MenuManagement';
import OrdersManagement from './pages/OrdersManagement';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <Routes>
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="/login" element={<Login />} />
          <Route path="/orders" element={<OrdersManagement />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;