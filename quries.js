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

function getOneHost(req, res, next){
	/*const email = req.decoded;
	const hostId = req.body.id;
	var response = {};
	db.one('select f.id, f.description, f.title, f.location, f.tags, f.created_at, f.datetime, f.noofguest, h.id, h.firstname, h.lastname from feasts f, hmfs h where f.id=$1 and h.id = f.uid', [hostId])
	.then((hf)=>{
		response = hf;
		return db.one('select count(*) as joining from hostfeast where fid=$1', [hostId]);
	})
	.then(hf)=>{
		response.joining = hf.joining;
		var token = statics.getToken(email);
		if (hfs.email != email){
			return res.status(200).json({
				success: true,
				message: token,
				data: response
			});
		}
		db.any('sele', [hostId]).then(()=>{
			var token = statics.getToken(email);
	 	  	return res.status(200).json({
				success: true,
				message: token,
				data: 'deleted'
			});
		});
	})
	.catch((err)=>{
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'cant delete' 
		});
	});
*/
}

function getHosts(req, res, next){
	var user = new User();
	user.getLocation(req).then((loc) => {
		var location = loc;
		db.any('select * from feasts where datetime >= now()')
		.then((feasts)=>{
			var token = statics.getToken(req.decoded);
			var data = user.getFeastByLocation(feasts,loc);
	 	  	return res.status(200).json({
				success: true,
				message: token,
				data: data
			});
		}).catch(()=>{
		 	return res.status(403).send({ 
		    	success: false, 
		    	message: 'no data dude' 
			});
		});
	}).catch(()=>{
	 	return res.status(403).send({ 
	    	success: false, 
	    	message: 'cant get location dude.' 
		});
	});
}

function deleteHost(req, res, next){
	const email = req.decoded;
	const hostId = req.body.id;
	db.one('select * from feasts f, hmfs h where h.email = $1 and f.id = $2', [email, hostId]).
	then((hfs)=>{
		if (hfs.email != email){
			return res.status(403).send({ 
		    	success: false, 
		    	message: 'cant delete' 
			});
		}
		db.none('delete from feasts where id=$1', [hostId]).then(()=>{
			var token = statics.getToken(email);
	 	  	return res.status(200).json({
				success: true,
				message: token,
				data: 'deleted'
			});
		});
	}).catch((err)=>{
		console.log(err);
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'cant delete' 
		});
	});
}

function createHost(req, res, next) {
	var host = new Host();
	var email = req.decoded;
	// TODO: CHeck when did the user create a host last and prevent spamming.
	var r = host.create(req);
	if (!r.succ){
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'cant create1' 
		});
	}
	db.task(t => {
    return t.one('select * from hmfs where email=$1', [email] )
        .then(user => {
        	host.uid = user.id;
            return t.one('insert into feasts(title, description, location, noofguest, datetime, tags, uid) values ($1, $2, $3, $4, $5, $6, $7) returning ID',  host.getArray()).then((h)=>{
            	host.id = h.id;
            });
        });
	}).then(()=>{
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
		    	var tsk = t;
				user.getFromRes(data);
				user.update(req).then(()=>{
		            return db.none('update hmfs set bio = $1, location = $2, image = $3, password =$4 where id = $5',  [user.bio, user.location, user.image, user.password, user.id]);
				}).catch(err=>{
					console.log(err);
					return res.status(403).send({ 
				    	success: false, 
				    	message: 'cant update user' 
					});
				});
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
  	set: createHost,
  	remove: deleteHost,
  	getOne: getOneHost
  },
  users: {
  	get: getUser,
  	set: setUser,
  	update: updateUser
  }
};