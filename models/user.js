var isEmail = require('validator/lib/isEmail');
var updateableFields = ['bio', 'location', 'image', 'password'];
var allFields = ['bio', 'location', 'image', 'phone','firstname', 'lastname', 'email', 'gender'];
var allFields2 = ['bio', 'location', 'image', 'phone','firstname', 'lastname', 'email', 'gender', 'password','id'];
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
		for (let i = updateableFields.length-1; i>=0; i--){
			if(req.body[updateableFields[i]]){
				this[updateableFields[i]] = req.body[updateableFields[i]];
			}
		}
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
}
module.exports = User;