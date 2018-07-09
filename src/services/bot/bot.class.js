/* eslint-disable no-unused-vars */
const logger = require('winston')
const TelegramBot = require('node-telegram-bot-api')

class Service {
    constructor (config) {
	this.telegram_bot = new TelegramBot(config.token, {polling: true})
	this.assistente_bot = config.config
	for (let key in this.assistente_bot) {
	    for (let message in this.assistente_bot[key]){
		this.telegram_bot[key](new RegExp(message), (msg, match) => {
		    this.assistente_bot[key][message](msg, match).then((data) => {
			for(let i in data.messages) {
			    this.create({
				id: msg.chat.id,
				message: data.messages[i]
			    }).then(function(_data_){
				logger.debug(_data_)
			    })
			}
		    })
		})
	    }
	}
    }
    
    async create (data) {
	return new Promise((resolve, reject) => {
	    logger.debug(data)
	    setTimeout(() => {
		try{
		    this.telegram_bot.sendMessage(data.id, ...data.message.value)
		    resolve(data.id)
		} catch (err) {
		    reject(err)
		}
	    }, 1000)
	})
    }			  
}

module.exports = function (options) {
    return new Service({
	username: options.telegram.username,
	token: options.telegram.token,
	config: options.config
    });
};

module.exports.Service = Service;
