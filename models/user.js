var isEmail = require('validator/lib/isEmail');


class User {

	getFromReq(req){
		this.phone = req.body.phone;
		this.password = req.body.password;
		this.gender = req.body.gender;
		this.email = req.body.email;
		this.firstName = req.body.first_name;
		this.lastName = req.body.last_name;
	}

	user(){
		return [this.email, this.password, this.phone, this.firstName, this.lastName, this.gender];
	}

	isValidUser(){
		const user = this.user();
		return new Promise((resolve, reject) => {
			console.log(user);
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