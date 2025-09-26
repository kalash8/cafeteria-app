// user-app/src/components/Navbar.js
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import logo from '../Assets/logo.png';  // Assuming same logo path; adjust if needed

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [isOpen, setIsOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 p-4 text-white flex justify-between items-center shadow-md"
      style={{ backgroundColor: '#003D5D', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' }}
    >
      {/* Logo + Title (Centered on Mobile) */}
      <div className="flex justify-center w-full md:w-auto md:ml-8">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="Logo" className="h-6 w-auto" />
          <span className="text-xl font-bold mt-1"> | Concentrix Café</span>
        </Link>
      </div>

      {/* Hamburger Icon (Visible on Mobile, only if token) */}
      {token && (
        <div className="md:hidden ml-8 mr-2">
          <button onClick={toggleMenu} className="focus:outline-none pt-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      )}

      {/* Navigation Links (Hidden on Mobile, Visible on Desktop, only if token) */}
      {token && (
        <>
          <div className="hidden md:flex mr-8 space-x-4">
            <Link to="/" className="hover:underline">Menu</Link>
            <Link to="/track" className="hover:underline">Orders</Link>
            <button onClick={logout} className="hover:underline">Logout</button>
          </div>
          {/* Mobile Menu (Toggles on Hamburger Click) */}
          <div className={`md:hidden absolute top-14 left-64 right-0 bg-[#003D5D] shadow-md rounded-b-xl ${isOpen ? 'block' : 'hidden'}`}>
            <div className="flex flex-col items-center py-4">
              <Link to="/" className="py-2 hover:underline" onClick={() => setIsOpen(false)}>Menu</Link>
              <Link to="/track" className="py-2 hover:underline" onClick={() => setIsOpen(false)}>Orders</Link>
              <button onClick={logout} className="py-2 hover:underline">Logout</button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;