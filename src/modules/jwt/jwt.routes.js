const express = require('express');
const { signToken, logout } = require('./jwt.controller');

const router = express.Router();

router.post('/sign', signToken);
router.post('/logout', logout);

module.exports = router;
