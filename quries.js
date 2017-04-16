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

function userStats(req, res, next){
	const email = req.decoded;
	const uid = req.body.uid || req.query.uid;
	var token = statics.getToken(email);
	var stats = {
		host : {
			upcoming : [],
			old: []
		},
		guest: {
			upcoming: [],
			old: []
		}
	};
	db.any('select f.id, f.title, f.datetime, f.noofguest, (select count(*) from hostfeast where fid =f.id) joined from feasts f where datetime >=now() and f.uid = (select id from hmfs where email = $1) order by datetime asc;', [email])
	.then( (upcoming)=> {
		stats.host.upcoming = upcoming;
		return db.any('select f.id, f.title, f.datetime, f.noofguest, (select count(*) from hostfeast where fid =f.id) joined from feasts f where datetime < now() and f.uid = (select id from hmfs where email = $1) order by datetime desc;', [email]);
	}).then ( (old)=> {
		stats.host.old = old;
		return db.any('select f.id, f.title, f.datetime, f.noofguest, (select count(*) from hostfeast where fid =f.id) joined from feasts f where f.datetime >= now() and f.id in (select fid from hostfeast where uid = (select id from hmfs where email = $1)) order by f.datetime asc', [email]);
	}).then ((upcoming)=>{
		stats.guest.upcoming = upcoming;
		return db.any('select f.id, f.title, f.datetime, f.noofguest, (select count(*) from hostfeast where fid =f.id) joined from feasts f where f.datetime < now() and f.id in (select fid from hostfeast where uid = (select id from hmfs where email = $1)) order by f.datetime desc', [email]);
	}).then ((old)=>{
		stats.guest.old = old;
		return res.status(200).json({
			success: true,
			message: token,
			data: stats
		});
	}).catch( ()=>{
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'cant get stats' 
		});
	})
}

function removeJoin(req, res, next){
	const email = req.decoded;
	const hostId = req.body.id || req.query.id;
	const uid = req.body.uid || req.query.uid;
	var token = statics.getToken(email);

	if (!hostId){
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'id missing' 
		});
	}
	// User hasn't passed the id, remove him if he is already ...
	if (!uid) {
		db.result('delete from hostfeast where fid = $1 and uid = (select id from hmfs where email = $2)',[hostId, email])
		.then ((result)=>{
			var success = result.rowCount == 1;
			var message = !success ? 'You havent joined' : 'removed';

			return res.status(200).json({
				success: success,
				message: token,
				data: message
			});
		})
		.catch(()=>{
		    return res.status(403).send({ 
		    	success: false, 
		    	message: 'id missing' 
			});
		});
	}else {
		db.any("select * from hmfs h, feasts f where f.id = $1 and h.email = $2 and f.uid = h.id",[hostId, email])		
		.then ((rec)=>{
			if (!rec.length){
			    return res.status(403).send({ 
			    	success: false, 
			    	message: 'You cant do this dude'
				});		
			}
			db.result('delete from hostfeast where fid=$1 and uid=$2', [hostId, uid])
			then((result)=> {
				var success = result.rowCount == 1;
				var message = !success ? 'user hasnt joined' : 'removed';
				return res.status(200).json({
					success: success,
					message: token,
					data: message
				});	
			})
			.catch(()=>{
			    return res.status(403).send({ 
			    	success: false, 
			    	message: 'something went wrong' 
				});
			});
		})
		.catch(()=>{
		    return res.status(403).send({ 
		    	success: false, 
		    	message: 'something went wrong' 
			});
		});
	}
	
}
function joinHost(req, res, next){
	const email = req.decoded;
	const hostId = req.body.id || req.query.id;
	if (!hostId){
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'id missing' 
		});
	}
	var noofguest;
	var userid;
	var token = statics.getToken(email);
	db.any("select h.id uid, f.noofguest from hmfs h, feasts f where f.id=$1 and h.id = f.uid;",[hostId])
	.then((record)=>{
		if (!record.length){
			return res.status(403).send({ 
		    	success: false, 
		    	message: 'Feast not found' 
			});
		}
		noofguest = record[0].noofguest;
		return db.any('select f.noofguest, h.id as uid from hmfs h, feasts f where h.email=$1 and f.id = $2 and f.uid = h.id', [email, hostId]);
	})
	.then((record)=>{
		if (!(record instanceof Array)){
			return record;
		}
		if(record.length){
			return res.status(403).send({ 
		    	success: false, 
		    	message: 'you cant join your own feast' 
			});
		}
		return db.any('select count(*) as joining from hostfeast where fid=$1', [hostId]);
	})
	.then((record)=>{
		if (!(record instanceof Array)){
			return record;
		}
		if (parseInt(record[0].joining) >= noofguest){
			if(record.length){
				return res.status(403).send({ 
			    	success: false, 
			    	message: 'feast full' 
				});
			}
		}
		return db.any('insert into hostfeast (uid, fid, approved) values ((select id from hmfs where email=$1),$2,$3) returning fid;', [email, hostId, (1 >>> 0).toString(2)]);
	})
	.then(record=>{
		if (!(record instanceof Array)){
			return record;
		}
		return res.status(200).json({
			success: true,
			message: token,
			data: "Joined"
		});
	})
	.catch(()=>{
		return res.status(403).send({ 
	    	success: false, 
	    	message: 'Can\'t join'
		});
	});

}

function getOneHost(req, res, next){
	const email = req.decoded;
	const hostId = req.query.id;
	if (!hostId){
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'id missing' 
		});
	}
	var token = statics.getToken(email);
	var response = {};
	db.one('select f.id, f.description, f.title, f.location, f.tags, f.created_at, f.datetime, f.noofguest, h.id as userid, h.firstname, h.lastname, h.email from feasts f, hmfs h where f.id=$1 and h.id = f.uid', [hostId])
	.then((hf)=>{
		response = hf;
		return db.one('select (select count(*) from hostfeast where fid=$1) as joining, (select count(*) from hostfeast where fid=$1 and uid=$2) as joined', [hostId, hf.userid]);
	})
	.then(hf=>{
		response.joining = hf.joining;
		response.ishost = response.email === email;
		if (response.email != email){
			delete response.email;
			response.canjoin = parseInt(hf.joining) < parseInt(response.noofguest) && parseInt(hf.joined) == 0;
			return res.status(200).json({
				success: true,
				message: token,
				data: response
			});
		}
		return db.any('select h.firstname, h.lastname, hf.uid, hf.created_at as joined from hostfeast hf, hmfs h where hf.fid=$1 and h.id = hf.uid order by joined asc', [hostId]);
	}).then((guests)=>{
		if (!(guests instanceof Array)){
			return guests;
		}
		response.canjoin = false;
		response.guests = guests;
			return res.status(200).json({
				success: true,
				message: token,
				data: response
			});
	})
	.catch((err)=>{
	    return res.status(403).send({ 
	    	success: false, 
	    	message: 'nothing to show' 
		});
	});
}

function getHosts(req, res, next){
	var user = new User();
	user.getLocation(req).then((loc) => {
		var location = loc;
		db.any('select f.id, f.uid, f.description, f.title, f.location, f.tags, f.created_at, f.datetime, f.noofguest, (select count(*) from hostfeast where fid =f.id) joined from feasts f where datetime >= now();')
		.then((feasts)=>{
			var data = user.getFeastByLocation(feasts,loc);
	 	  	return res.status(200).json({
				success: true,
				message: 'N/a',
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
  	getOne: getOneHost,
  	join: joinHost,
  	removeJoin: removeJoin
  },
  users: {
  	get: getUser,
  	set: setUser,
  	update: updateUser,
  	stats: userStats
  }
};