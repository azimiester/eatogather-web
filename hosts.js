var express = require('express');
var router = express.Router();
var db = require('./quries');
var statics = require('./statics');
var bodyParser = require('body-parser');

router.post('/create', statics.authenticateMiddleWare, db.hosts.set);
router.get('/', db.hosts.get);

module.exports = router;
