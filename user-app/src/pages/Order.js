import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Order = () => {
  const navigate = useNavigate();
  useEffect(() => navigate('/'), []);
  return <div>Redirecting to Menu...</div>;
};

export default Order;