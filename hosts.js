var express = require('express');
var router = express.Router();
var db = require('./quries');
var statics = require('./statics');

//router.use(statics.authenticateMiddleWare);
router.get('/', db.hosts.get);

module.exports = router;