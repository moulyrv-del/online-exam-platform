const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../controllers/authController');

const router = express.Router();

router.post('/register', asyncHandler(auth.register));
router.post('/login', asyncHandler(auth.login));

module.exports = router;
