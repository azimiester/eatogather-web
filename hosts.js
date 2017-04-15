var express = require('express');
var router = express.Router();
var db = require('./quries');
var statics = require('./statics');
var bodyParser = require('body-parser');

router.post('/create', statics.authenticateMiddleWare, db.hosts.set);
router.post('/remove', statics.authenticateMiddleWare, db.hosts.remove);
//router.post('/delete', statics.authenticateMiddleWare, db.hosts.delete);
router.get('/', db.hosts.get);

module.exports = router;
