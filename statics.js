var statics = {};
var jwt = require('jsonwebtoken');
var appSec = "Israeeltumharamebehnkochodon";
statics.appSecret = appSec;

statics.authenticateMiddleWare = function (req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (token) {
    jwt.verify(token, appSec, function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        req.decoded = decoded.user;    
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

statics.getToken = function(email){
  return jwt.sign({user: email}, appSec, {
              expiresIn : 60*60*24*100
        });
};
module.exports = statics;