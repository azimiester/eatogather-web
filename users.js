var express = require('express');
var router = express.Router();
var db = require('./quries');
router.post('/signup', db.users.set);
router.get('/authenticate', db.users.get);
module.exports = router;