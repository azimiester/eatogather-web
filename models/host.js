var required = ['title', 'description', 'location', 'noofguest', 'datetime'];
var fields = required.concat(['tags', 'uid']);
var reg = new RegExp("^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}");
class host {
	checkRequired(attrs){
		for (let attr of required){
			if(!attrs[attr]){
				return false;
			}
		}
		return true;
	}
	checkLocation(){
		// TODO: Check latitude and longitude.
	}
	create (req) {
		if (!req){
			return {
				msg: 'request not found', 
				succ: false
			};
		}
		var reqBody = req.body;
		var checked = this.checkRequired(reqBody);
		if (!checked){
			return {
				msg: 'missing parameters not found', 
				succ: false
			};
		}

		for (let attr of fields){
			if (reqBody[attr]){
				this[attr] = reqBody[attr];
			}
		}
		return {
				msg: '', 
				succ: true
			};
	}
	getArray(){
		var ret = [];
		for (let attr of fields) {
			ret.push(this[attr]);
		}
		return ret;
	}
}

module.exports = host;