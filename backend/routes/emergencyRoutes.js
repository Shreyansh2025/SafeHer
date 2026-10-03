const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const emergencyController = require('../controllers/emergencyController');

// All routes require authentication
router.use(authMiddleware);

<<<<<<< HEAD
router.get('/', emergencyController.getAll);
=======
>>>>>>> origin/main
router.post('/trigger', emergencyController.trigger);
router.put('/:id/resolve', emergencyController.resolve);

module.exports = router;