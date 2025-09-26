import axios from "axios";

const OrderCard = ({ order, onDelete }) => {
  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`/api/orders/${order._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete(order._id); // let parent component remove it from list
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete order");
    }
  };

  return (
    <div className="bg-white p-4 m-2 rounded shadow">
      <h3>Order #{order._id.slice(-6)}</h3>
      <p>Total: ₹{order.total}</p>
      <p>Status: {order.status}</p>
      <p>Pickup: {new Date(order.pickupTime).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })}</p>
      <div className="mt-2">
        <h4 className="font-semibold">Items:</h4>
        {order.items.map((it) => (
          <p key={it._id}>
            {it.menuItemId
              ? `${it.menuItemId.name} (x${it.quantity})`
              : `Item removed (x${it.quantity})`}
          </p>
        ))}
      </div>
      {order.status === "Completed" && (
        <button
          onClick={handleDelete}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete Order
        </button>
      )}
    </div>
  );
};

export default OrderCard;