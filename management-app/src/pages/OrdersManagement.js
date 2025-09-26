import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import OrderCard from '../components/OrderCard';
import { useNavigate } from 'react-router-dom';

const OrdersManagement = () => {
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
      const res = await axios.get('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
      // Sort orders by createdAt in descending order (newest first)
      const sortedOrders = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (err) {
      console.error('Orders fetch error:', err);
      if (err.response?.status === 403) navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Initial fetch
    fetchOrders();
    // Set up polling every 10 seconds
    const intervalId = setInterval(fetchOrders, 10000); // 10 seconds
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/orders/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      // Re-fetch orders to refresh the list
      await fetchOrders();
    } catch (err) {
      console.error('Status update error:', err);
      alert('Update failed');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Manage Orders</h1>
      {orders.length === 0 ? <p>Waiting for orders</p> : orders.map(order => (
        <div key={order._id} className="bg-white p-4 m-2 rounded shadow">
          <OrderCard order={order} />
          <select value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)} className="ml-4 p-2 border rounded">
            <option value="Received">Received</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      ))}
    </div>
  );
};

export default OrdersManagement;