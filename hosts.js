var express = require('express');
var router = express.Router();
var db = require('./quries');
var statics = require('./statics');
var bodyParser = require('body-parser');

router.post('/create', statics.authenticateMiddleWare, db.hosts.set);
router.post('/remove', statics.authenticateMiddleWare, db.hosts.remove);
router.get('/', db.hosts.get);
router.get('/one', statics.authenticateMiddleWare, db.hosts.getOne);
router.post('/join', statics.authenticateMiddleWare, db.hosts.join);
router.post('/unjoin', statics.authenticateMiddleWare, db.hosts.removeJoin);

module.exports = router;
