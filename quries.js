var promise = require('bluebird');
var cs = require('./connectionString');
var statics = require('./statics');

var options = {
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = cs.connection;
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
	const username = req.body.username;
	const password = req.body.password;
	const gender = req.body.gender;
	const email = req.body.email;
	const firstName = req.body.first_name;
	const lastName = req.body.last_name;
	const user = [username, password, gender, email, firstName, lastName];
	console.log(req.body);
	// TODO: validation in a new file
	// TODO: check if the user is already there.

	for (var key in user){
		if (!user.hasOwnProperty(key) || user[key] != undefined){
			continue;
		}
		res.status(400).json({
			status: 'error',
			data: user[key] +"No shit motherfucker."
		});
	}
	db.one('insert into hmfs(username, password, gender, email, first_name, last_name) values ($1, $2, $3, $4, $5, $6)', user)
		.then(data=>{
		    return res.status(200).send({ 
	        	success: true, 
	        	message: 'user added: ' + data.username 
			});
		})
		.catch(err => {
		    return res.status(403).send({ 
	        	success: false, 
	        	message: 'user not added '
			});
		})
}

function getUser(req, res, next) {
	const username = req.body.username;
	const password = req.body.password;
  db.any('select * from hmfs where username = \''+ username+'\' and password = \''+ password+ '\'')
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


module.exports = {
  hosts: {
  	get: getHosts
  },
  users: {
  	get: getUser,
  	set: setUser
  }
};