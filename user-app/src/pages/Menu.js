import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../CSS/menu.css';

const CartPopup = ({ items, selected, addToOrder, removeFromOrder, calculateTotal, onClose, onProceed }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl mb-2 rounded-t-lg max-h-[80vh] overflow-y-auto transition-transform duration-300 transform translate-y-0">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Final Check</h2>
          <button onClick={onClose} className="text-gray-600 font-bold">×</button>
        </div>
        {selected.length === 0 ? (
          <p className="text-gray-600">Empty cart looks lonely</p>
        ) : (
          selected.map(sel => {
            const item = items.find(i => i._id === sel.menuItemId);
            if (!item) return null;
            return (
              <div key={sel.menuItemId} className="flex justify-between items-center border-b py-2">
                <span>{item.name} x {sel.quantity}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => removeFromOrder(sel.menuItemId)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    −
                  </button>
                  <button
                    onClick={() => addToOrder(item)}
                    className="px-2 py-1 bg-blue-500 text-white rounded"
                  >
                    +
                  </button>
                  <span className="ml-2">₹{(item.price * sel.quantity).toFixed(2)}</span>
                </div>
              </div>
            );
          })
        )}
        {selected.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold">Total: ₹{calculateTotal().toFixed(2)}</p>
            <button
              onClick={onProceed}
              className="w-full bg-green-600 text-white p-2 mt-2 rounded"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Menu = () => {
  const [items, setItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [vendors, setVendors] = useState([]);
  const [openVendors, setOpenVendors] = useState(new Set());
  const [selected, setSelected] = useState([]);
  const [currentVendorId, setCurrentVendorId] = useState(null);
  const [pickupTime, setPickupTime] = useState(new Date());
  const [showCart, setShowCart] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(true); // New state for order summary visibility
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [vendorsRes, menuRes] = await Promise.all([
        axios.get('/api/vendors', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/menu/daily/${new Date().toISOString().split('T')[0]}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      console.log('Vendors:', vendorsRes.data);
      setVendors(vendorsRes.data);

      console.log('Fetched items:', menuRes.data);
      const sortedItems = menuRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(sortedItems);

      const grouped = sortedItems.reduce((acc, item) => {
        const vid = item.vendorId?._id;
        if (!vid) {
          console.warn('Item with missing vendorId:', item);
          return acc;
        }
        if (!acc[vid]) acc[vid] = [];
        acc[vid].push(item);
        return acc;
      }, {});
      console.log('Grouped items:', grouped);
      setGroupedItems(grouped);
    } catch (err) {
      console.error('Data fetch error:', err);
      if (err.response?.status === 403) navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const toggleVendor = (id) => {
    setOpenVendors((prev) => {
      if (prev.has(id)) {
        return new Set();
      }
      return new Set([id]);
    });
  };

  const addToOrder = (item) => {
    const itemVendorId = item.vendorId?._id;
    if (!itemVendorId) return;

    if (selected.length > 0 && itemVendorId !== currentVendorId) {
      alert('One stall at a time Bruh. Dont worry soon you will order from two or more stalls');
      return;
    }

    const existing = selected.find(s => s.menuItemId === item._id);
    if (existing) {
      existing.quantity += 1;
      setSelected([...selected]);
    } else {
      setSelected([...selected, { menuItemId: item._id, quantity: 1 }]);
    }

    if (selected.length === 0) {
      setCurrentVendorId(itemVendorId);
    }
  };

  const removeFromOrder = (menuItemId) => {
    const existingIndex = selected.findIndex(s => s.menuItemId === menuItemId);
    if (existingIndex === -1) return;

    const newSelected = [...selected];
    if (newSelected[existingIndex].quantity > 1) {
      newSelected[existingIndex].quantity -= 1;
    } else {
      newSelected.splice(existingIndex, 1);
    }

    setSelected(newSelected);

    if (newSelected.length === 0) {
      setCurrentVendorId(null);
    }
  };

  const calculateTotal = () => {
    return selected.reduce((sum, sel) => {
      const item = items.find(i => i._id === sel.menuItemId);
      return sum + (item ? item.price * sel.quantity : 0);
    }, 0);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const token = localStorage.getItem('token');
    const total = calculateTotal();
    if (total === 0 || selected.length === 0) {
      alert('Select items');
      return;
    }

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay SDK failed to load');
        return;
      }

      const { data: { key } } = await axios.get('/api/payment/key', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { data: { orderId, amount } } = await axios.post('/api/payment/create-order', { amount: total }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const options = {
        key,
        amount,
        currency: 'INR',
        name: 'Cafeteria App',
        description: 'Pre-order payment',
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: selected,
              pickupTime,
              total
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            alert('Payment successful! Order created.');
            setSelected([]);
            setCurrentVendorId(null);
            setShowCart(false);
            setShowOrderSummary(true); // Show order summary after payment success
            navigate('/track');
          } catch (err) {
            alert('Payment verification failed');
            setShowOrderSummary(true); // Show order summary if payment fails
          }
        },
        prefill: {
          name: 'User',
          email: localStorage.getItem('email') || 'user@cafeteria.com'
        },
        theme: { color: '#3399cc' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Payment initiation failed: ' + (err.response?.data?.msg || err.message));
      setShowOrderSummary(true); // Show order summary if payment initiation fails
    }
  };

  return (
    <div className="p-4 relative">
      <div className="mt-20">
        <label className="block mb-2 text-lg font-semibold text-gray-700">
          Pick Your Time to Grab Your Food! 🍽️
        </label>
        <div className="relative">
          <DatePicker
            selected={pickupTime}
            onChange={(date) => setPickupTime(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="MMMM d, yyyy h:mm aa"
            className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-white text-gray-800"
            placeholderText="Select pickup time"
            minDate={new Date()}
            popperClassName="custom-datepicker-popper"
            wrapperClassName="w-full"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">📅</span>
        </div>
      </div>
      <h1 className="text-2xl font-semibold text-gray-700">What's Cooking?</h1>
      {vendors.map(vendor => (
        <div key={vendor._id} className="mb-4">
          <button
            className="bg-gradient-to-br from-blue-200 to-blue-400 mt-4 p-4 w-full text-left rounded-xl font-bold shadow-lg border border-blue-300 hover:shadow-xl transition-shadow duration-300 min-h-32"
            onClick={() => toggleVendor(vendor._id)}
          >
            {vendor.name} {openVendors.has(vendor._id) ? '−' : '+'}
          </button>
          {openVendors.has(vendor._id) && (
            <div className="mt-2">
              {(groupedItems[vendor._id] || []).length > 0 ? (
                groupedItems[vendor._id].map(item => {
                  const selectedItem = selected.find(s => s.menuItemId === item._id);
                  const quantity = selectedItem ? selectedItem.quantity : 0;
                  return (
                    <div key={item._id} className="bg-white p-4 m-2 rounded flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p>{item.description}</p>
                        <p className="text-green-600">₹{item.price}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromOrder(item._id)}
                          className="px-2 py-1 bg-red-500 text-white rounded"
                          disabled={quantity === 0}
                        >
                          −
                        </button>
                        <span>{quantity}</span>
                        <button
                          onClick={() => addToOrder(item)}
                          className="px-2 py-1 bg-blue-500 text-white rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-600">No items available today from this stall.</p>
              )}
            </div>
          )}
        </div>
      ))}
      
      {selected.length > 0 && showOrderSummary && ( // Conditionally render order summary
        <div className="bg-white p-4 rounded shadow mt-4">
          <h2 className="text-lg font-bold mb-2">Order Summary</h2>
          {selected.map(sel => {
            const item = items.find(i => i._id === sel.menuItemId);
            if (!item) return null;
            return (
              <div key={sel.menuItemId} className="flex justify-between items-center border-b py-2">
                <span>{item.name} x {sel.quantity}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => removeFromOrder(sel.menuItemId)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    −
                  </button>
                  <button
                    onClick={() => addToOrder(item)}
                    className="px-2 py-1 bg-blue-500 text-white rounded"
                  >
                    +
                  </button>
                  <span className="ml-2">₹{(item.price * sel.quantity).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
          <p className="font-semibold mt-4">Total: ₹{calculateTotal().toFixed(2)} ({selected.length} items)</p>
          <div className="flex items-center space-x-2">
  <button
    onClick={() => {
      setShowCart(true);
      setShowOrderSummary(false); // Hide order summary when opening cart
    }}
    className="flex-1 bg-green-600 text-white p-2 mt-2 rounded"
  >
    Pay and Order
  </button>
  <span className="text-gray-500 text-2xl font-semibold">|</span>
  <button
    onClick={() => {
      setShowCart(true);
      setShowOrderSummary(false); // Hide order summary when opening cart
    }}
    className="flex-1 bg-green-600 text-white p-2 mt-2 rounded"
  >
    Order and Pay
  </button>
</div>
        </div>
      )}
      {showCart && (
        <CartPopup
          items={items}
          selected={selected}
          addToOrder={addToOrder}
          removeFromOrder={removeFromOrder}
          calculateTotal={calculateTotal}
          onClose={() => {
            setShowCart(false);
            setShowOrderSummary(true); // Show order summary when closing cart
          }}
          onProceed={handlePayment}
        />
      )}
    </div>
  );
};

export default Menu;