import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OrderCard from '../components/OrderCard';
import { useNavigate } from 'react-router-dom';

const Track = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  // Function to fetch orders
  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.get('/api/orders/my', { headers: { Authorization: `Bearer ${token}` } });
      // Sort orders by createdAt in descending order (newest first)
      const sortedOrders = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (err) {
      console.error('Orders fetch error:', err);
      if (err.response?.status === 403) {
        navigate('/login');
      } else {
        alert('Fetch failed');
      }
    }
  }, [navigate]);

  useEffect(() => {
    // Initial fetch
    fetchOrders();
    // Set up polling every 10 seconds
    const intervalId = setInterval(fetchOrders, 20000); // 20 seconds
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Track Orders</h1>
      {orders.length === 0 ? <p>Order something Bruh</p> : orders.map(order => (
        <OrderCard 
          key={order._id} 
          order={order} 
          onDelete={(id) => setOrders(orders.filter(o => o._id !== id))}
        />
      ))}
    </div>
  );
};

export default Track;