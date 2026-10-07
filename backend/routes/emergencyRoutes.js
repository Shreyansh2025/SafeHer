const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const emergencyController = require('../controllers/emergencyController');

// All routes require authentication
router.use(authMiddleware);

router.get('/', emergencyController.getAll);
router.post('/trigger', emergencyController.trigger);

router.post('/test-call', emergencyController.testCall);
// router.post('/test-vonage-call', emergencyController.testVonageCall);

router.put('/:id/resolve', emergencyController.resolve);

module.exports = router;