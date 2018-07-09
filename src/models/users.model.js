// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
const logger = require('winston')

module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    let table = {
	telegramId: { type: String, required: true },
	isAdmin: { type: Boolean }
    }
    let users = new mongooseClient.Schema(table, {
	timestamps: true
    })

    let Users = mongooseClient.model('users', users);

    let whitelist = [
	app.get('authentication').telegram.username,
	...app.get('authentication').telegram.whitelist
    ]
    //  Pre-save some data
    users.pre('save', function(next) {
	let self = this
	Users.find({telegramId: self.telegramId}).then(function(users){
	    if(users.length > 0) {
		logger.error("telegramId must be unique");
		self.invalidate("telegramId", "telegramId must be unique")
		return new Error("telegramId must be unique")
	    }
	    else {
		self.isAdmin = false
		for (let i in whitelist) {
		    if (telegramId === whitelist[i]){
			self.isAdmin = true
			break;
		    }
		}
		next()
	    }
	}).catch(next)
    })
    
    return Users
};
