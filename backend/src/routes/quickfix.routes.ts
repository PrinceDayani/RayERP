const express = require('express');
const router = express.Router();

// Ultra-simple fast endpoint
router.get('/projects', (req, res) => {
  res.json({ 
    success: true, 
    data: [], 
    message: 'Fast endpoint working',
    timestamp: Date.now()
  });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', fast: true });
});

module.exports = router;