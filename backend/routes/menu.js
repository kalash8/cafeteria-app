const express = require('express');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/daily/:date', async (req, res) => {
  try {
    const startOfDay = new Date(req.params.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(req.params.date);
    endOfDay.setHours(23, 59, 59, 999);
    const items = await MenuItem.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('vendorId', 'name');
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ msg: 'Access denied' });
  try {
    const items = await MenuItem.find({ vendorId: req.user.id }).populate('vendorId', 'name');
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ msg: 'Access denied' });
  try {
    const { date, ...otherFields } = req.body;
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0); // Normalize to start of day
    const item = new MenuItem({ ...otherFields, date: normalizedDate, vendorId: req.user.id });
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ msg: 'Access denied' });
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'vendor') return res.status(403).json({ msg: 'Access denied' });
  try {
    const item = await MenuItem.findOneAndDelete({ _id: req.params.id, vendorId: req.user.id });
    if (!item) {
      return res.status(404).json({ msg: 'Menu item not found or not authorized' });
    }
    res.json({ msg: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;