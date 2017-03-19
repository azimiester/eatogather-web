var promise = require('bluebird');
var cs = require('./connectionString');
var statics = require('./statics');
var jwt = require('jsonwebtoken');
var User = require('./models/user');

var options = {
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = process.env.DATABASE_URL || cs.connection;
var db = pgp(connectionString);

function getHosts(req, res, next) {
  db.any('select * from hmfs')
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved All Hungry motherfuckers.'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function setUser(req, res, next){
	var user = new User();
	user.getFromReq(req);
	user.isValidUser().then((record)=>{
		db.none('insert into hmfs(email, password, phone, first_name, last_name, gender) values ($1, $2, $3, $4, $5, $6)', record)
		.then(()=>{
			var token = statics.getToken(record[0]);
		    return res.status(200).send({ 
	        	success: true, 
	        	message: token
			});
		})
		.catch(err => {
			var message = "user not added";
			if (err.code ==='23505'){
				message = err.detail;
			}
		    return res.status(403).send({ 
	        	success: false, 
	        	message: message
			});
		})
	}).catch((err)=>{
		console.log(err);
		res.status(400).json({
			success: false,
			message: err
		});
	});
}

function getUser(req, res, next) {
	const email = req.body.email;
	const password = req.body.password;
	db.any('select * from hmfs where email = \''+ email+'\' and password = \''+ password+ '\'')
	.then(function (data) {
		var token = statics.getToken(username);
	  	res.status(200).json({
			success: 'true',
			data: token,
		});
	})
	.catch(function (err) {
		console.log(err);
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'User Doesn\'t exists' 
		});
	});
}


module.exports = {
  hosts: {
  	get: getHosts
  },
  users: {
  	get: getUser,
  	set: setUser
  }
};