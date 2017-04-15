var required = ['title', 'uid', 'description', 'location'];
var fields = required.concat(['tags']);
var reg = new RegExp("^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}");
class host {
	checkRequired(attrs){
		for (let attr of required){
			if(!attrs[attr]){
				return attr;
			}
		}
		return true;
	}
	checkLocation(){
		// TODO: Check latitude and longitude.
	}
	create (req) {
		return new Promise((resolve, reject)=>{
			if (!req){
				reject('request not found');
			}
			var reqBody = req.body;
			var checked = this.checkRequired(reqBody);
			if (!checked){
				reject('{checked} not found');
				return;
			}

			for (let attr of fields){
				if (reqBody[attr]){
					this[attr] = reqBody[attr];
				}
			}
			resolve();
		});
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