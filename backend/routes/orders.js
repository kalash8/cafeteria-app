const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ msg: 'Access denied' });
  try {
    let total = 0;
    for (let item of req.body.items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      total += menuItem.price * item.quantity;
    }

    const order = new Order({ ...req.body, userId: req.user.id, total });
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get('/my', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ msg: 'Access denied' });
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.menuItemId', 'name price');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ msg: 'Access denied' });
  try {
    const orders = await Order.find({})
      .populate('userId', 'name')
      .populate('items.menuItemId', 'name price')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ msg: 'Access denied' });
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ msg: 'Access denied' });

  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ msg: 'Order not found' });

    // Make sure the order belongs to the logged-in user
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Only allow delete if Completed
    if (order.status !== 'Completed') {
      return res.status(400).json({ msg: 'You can only delete completed orders' });
    }

    await order.deleteOne();
    res.json({ msg: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;