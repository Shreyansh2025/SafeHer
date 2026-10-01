const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');

router.post('/trigger', emergencyController.trigger);
router.put('/:id/resolve', emergencyController.resolve);

module.exports = router;