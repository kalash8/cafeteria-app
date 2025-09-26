import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: 0, date: new Date().toISOString().split('T')[0] });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.get('/api/menu', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setItems(res.data));
  }, [navigate]);

  const addItem = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('/api/menu', newItem, { headers: { Authorization: `Bearer ${token}` } });
      setItems([...items, res.data]);
      setNewItem({ name: '', description: '', price: 0, date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      alert(err.response?.data?.msg || 'Error');
    }
  };

  const deleteItem = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/menu/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setItems(items.filter(item => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.msg || 'Error deleting item');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Menu Management</h1>
      <div className="bg-white p-4 rounded shadow mb-4">
        <input type="text" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} placeholder="Name" className="w-full p-2 mb-2 border block" required />
        <input type="text" value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} placeholder="Description" className="w-full p-2 mb-2 border block" />
        <input type="number" step="0.01" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})} placeholder="Price" className="w-full p-2 mb-2 border block" required />
        <input type="date" value={newItem.date} onChange={(e) => setNewItem({...newItem, date: e.target.value})} className="w-full p-2 mb-2 border block" required />
        <button onClick={addItem} className="bg-green-600 text-white p-2 rounded">Add Item</button>
      </div>
      <div>
        {items.map(item => (
          <div key={item._id} className="bg-white p-4 m-2 rounded shadow flex justify-between items-center">
            <div>
              <h3 className="font-bold">{item.name}</h3>
              <p>{item.description} - ₹{item.price}</p>
              <p>Date: {new Date(item.date).toDateString()}</p>
            </div>
            {/* Edit placeholder: Add form/modal */}
            <button onClick={() => deleteItem(item._id)} className="bg-yellow-600 text-white px-4 py-1 rounded">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuManagement;