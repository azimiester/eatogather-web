var isEmail = require('validator/lib/isEmail');
var updateableFields = ['bio', 'location', 'image', 'password'];
var allFields = ['bio', 'location', 'image', 'phone','firstname', 'lastname', 'email', 'gender'];
var allFields2 = ['bio', 'location', 'image', 'phone','firstname', 'lastname', 'email', 'gender', 'password','id'];
var fs = require('fs');
var dir = './tmpss';
var http = require('http');
var statics = require('../statics');

class User {

	getFromReq(req){
		this.phone = req.body.phone;
		this.password = req.body.password;
		this.gender = req.body.gender;
		this.email = req.body.email;
		this.firstName = req.body.first_name;
		this.lastName = req.body.last_name;
	}

	update(req){
		return new Promise((resolve, reject)=>{
			for (let i = updateableFields.length-1; i>=0; i--){
				if(req.body[updateableFields[i]]){
					this[updateableFields[i]] = req.body[updateableFields[i]];
				}
			}
			if (!req.files.image){
				resolve();
				return;
			}
			let image = req.files.image;
			if (!(/\.(gif|jpg|jpeg|tiff|png)$/i).test(filename)){
				resolve();
				return;
			}
			if (!fs.existsSync(dir)){
			    fs.mkdirSync(dir);
			}
			var dirName = new Date().getTime()+'';
			if (!fs.existsSync(`${dir}/${dirName}`)){
			    fs.mkdirSync(`${dir}/${dirName}`);
			}
			var img = `${dir}/${dirName}/${image.name}`;
			image.mv(img, function(err) {
				//TODO: Check image size and extension
				if (err){
					resolve();
					return;
				}
			});
			this['image'] = img.substring(1, img.length);
		})


	}

	getFromRes(user){
		for (let i = allFields2.length-1; i>=0; i--){
			this[allFields2[i]] = user[allFields2[i]];
		}
	}
	userForResponse(){
		var res = {};
		for (let i = allFields.length-1; i>=0; i--){
			if(this[allFields[i]]){
				res[allFields[i]] = this[allFields[i]];
			}
		}
		return res;
	}

	user(){
		return [this.email, this.password, this.phone, this.firstName, this.lastName, this.gender];
	}

	isValidUser(){
		const user = this.user();
		return new Promise((resolve, reject) => {
			for (var key in user){
				if (!user.hasOwnProperty(key) || user[key] != undefined){
					continue;
				}
				reject("Undefined or Empty value");
				return;
			}
			if (isEmail(this.email)){
				resolve(user);
				return;
			}
			reject("Email Not valid");
		});
	}
	getLocation(req){
		return new Promise(function (resolve, reject){
			if (req.body.location){
				var ret = req.body.location.split(' ').map((v)=>{
					return parseFloat(v);
				});
				resolve(ret);
			}
			var ip = req.headers['x-forwarded-for'] || 
				req.connection.remoteAddress || 
				req.socket.remoteAddress ||
				req.connection.socket.remoteAddress;
				ip = '82.130.8.196';
			if (!/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(ip)){
				reject();
			}
			var options = {
			  host: 'www.freegeoip.net',
			  path: '/json/'+ip
			};
			var callback = function(response) {
				var str = '';
				response.on('data', function (chunk) {
					str += chunk;
				});
				response.on('end', function () {
					var res = JSON.parse(str);
					resolve([res.latitude, res.longitude]);
				});
			}

			http.request(options, callback).end();

		});
	}
	getFeastByLocation(feasts, location){
		var res = [];
		for (let feast of feasts){
			var flocation = feast.location.split(' ').map((v)=>{
				return parseFloat(v);
			});
			var distance = statics.getDistanceFromLatLonInKm(flocation[0], flocation[1], location[0], location[1]);
			feast.distance = distance;
		}
		feasts.sort((a,b)=>{
			return a.distance-b.distance;
		})
		return feasts;
	}
}
module.exports = User;