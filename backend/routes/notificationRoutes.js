const express = require('express');
const router = express.Router();

const { getAlertforContact } = require('../controllers/notificationController');

router.get('/:contactId', getAlertforContact);

module.exports = router;