const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.get('/key', (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

router.post('/create-order', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ msg: 'Access denied' });
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/verify', auth, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ msg: 'Access denied' });
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, pickupTime, total } = req.body;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ msg: 'Invalid signature' });
    }

    const order = new Order({
      userId: req.user.id,
      items,
      total,
      status: 'Received',
      pickupTime,
      orderDate: Date.now()
    });
    await order.save();

    res.json({ msg: 'Payment verified and order created', order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;