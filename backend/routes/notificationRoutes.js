const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const { getAlertforContact } = require('../controllers/notificationController');

// All routes require authentication
router.use(authMiddleware);

router.get('/:contactId', getAlertforContact);

module.exports = router;