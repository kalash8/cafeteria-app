const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('_id name');
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;