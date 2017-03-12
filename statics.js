var statics = {};
var jwt = require('jsonwebtoken');
statics.appSecret = "Israeeltumharamebehnkochodon";
statics.authenticateMiddleWare = function (req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (token) {
    jwt.verify(token, 'Israeeltumharamebehnkochodon', function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        req.decoded = decoded;    
        next();
      }
    });
  } else {
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
};
module.exports = statics;