var promise = require('bluebird');
var cs = require('./connectionString');
var jwt = require('jsonwebtoken');
var User = require('./models/user');
var Host = require('./models/host');
var statics = require('./statics');

var options = {
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = process.env.DATABASE_URL || cs.connection;
var db = pgp(connectionString);

function getHosts(){

}

function createHost(req, res, next) {
	var host = new Host();
	var email = req.decoded;
	// TODO: CHeck when did the user create a host last and prevent spamming.
	host.create(req).then(()=>{
		db.task(t => {
	    return t.one('select * from hmfs where email=$1', [email] )
	        .then(user => {
	        	host.uid = user.uid;
	            return t.one('insert into feast(title, uid, description, location, tags) values ($1, $2, $3, $4, $5)',  host.getArray());
	        });
		})
	}).then(()=>{
		delete host.uid;
		var token = statics.getToken(email);		
 	  	return res.status(200).json({
			success: true,
			message: token,
			data: host
		});
	}).catch((err)=>{
		console.log(err);
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'cant create' 
		});
	});
}

function setUser(req, res, next){
	var user = new User();
	user.getFromReq(req);
	user.isValidUser().then((record)=>{
		db.none('insert into hmfs(email, password, phone, firstName, lastName, gender) values ($1, $2, $3, $4, $5, $6)', record)
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
		return res.status(203).json({
			success: false,
			message: err
		});
	});
}

function getUser(req, res, next) {
	const email = req.body.email;
	const password = req.body.password;
	if (!email || !password){
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'Wrong Email or Password' 
		});
	}
	db.one('select * from hmfs where email=$1 and password=$2', [email, password] )
	.then(function (data) {
	var user = new User();
	user.getFromRes(data);
		var token = statics.getToken(email);
	  	return res.status(200).json({
			success: true,
			message: token,
			data: user.userForResponse()
		});
	}).catch(function (err) {
		console.log(err);
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'Wrong Email or Password' 
		});
	});
}

function updateUser(req, res, next){
	var email = req.decoded;
	var user = new User();
	db.task(t => {
    return t.one('select * from hmfs where email=$1', [email] )
        .then(data => {
			user.getFromRes(data);
			user.update(req);
            return t.none('update hmfs set bio = $1, location = $2, image = $3, password =$4 where id = $5',  [user.bio, user.location, user.image, user.password, user.id]);
        });
	}).then(() => {
		var token = statics.getToken(email);
 	  	return res.status(200).json({
			success: true,
			message: token,
			data: user.userForResponse()
		});
	}).catch(function (err) {
		console.log(err);
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'cant update user' 
		});
	});
}


module.exports = {
  hosts: {
  	get: getHosts,
  	set: createHost
  },
  users: {
  	get: getUser,
  	set: setUser,
  	update: updateUser
  }
};