/* eslint-disable no-unused-vars */
const logger = require('winston');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');

class Service {

  constructor (options) {
    this.options = {};
    fs.readdirSync(options.root).forEach(dir => {
      if (dir !== '.' && dir !== '..') {
        this.options[dir] = [];
        fs.readdirSync(options.root+'/'+dir).forEach(file => {
          this.options[dir].push(file);
        });
      }
    });
  }

  setup(app) {
    this.app = app;
    let token = this.app.get('authentication').telegram.token;
    // The bot
    this.telegram_bot = new TelegramBot(token, {polling: true});
    // onItem is a onText, onAudio, etc...
    Object.keys(this.options).map(onItem => {
      // command is any macro message sent by user
      this.options[onItem].map(command => {
        // a message is parsed by a regexpression
        command = command.split('.json')[0];
        let regular_expression = new RegExp('/'+command);
        this.telegram_bot[onItem](regular_expression, (msg, match) => {
          // Fake a environment
          let data = { name: command, data: { chat_id: msg.chat.id, username: msg.from.first_name, url_cadastro: this.app.get('authentication').jwt.payload.audience }};
          logger.debug(data);
          // parse a the environment on templated json
          // found user first
          this.app.service('users').find({ telegramId: msg.chat.id }).then(function(res){
            // if found
            if(res.data > 0) {
              return this.app.service('bot').get(data);
            // if not found
            } else {
              data.name = 'cadastre-se';
              return this.app.service('bot').get(data); 
            }
          }).then(function(messages){
            // send the parsed template
            return this.app.service('bot').create(messages);
          });
        });
      });
    });

    // share location
    this.telegram_bot.once('location', (msg, match) => {
      this.app.service('users').find({telegramId: msg.chat.id}).then((res) => {
        return this.app.service('users').patch(res.data[0]._id, { lat: msg.location.latitude, lon: msg.location.longitude});
      }).then((res) => {
        return this.create({ id: msg.chat.id, message: { type: 'string', value: 'Localização salva'}});
      });
    });
  }

  // POST /bot will send a message with the bot
  async create (data) {
    return new Promise((resolve, reject) => {
      setTimeout(()=> {
        try{
          // send message if a text
          let fn = this.telegram_bot['send'+data.message.type];
          if( data.message.type === 'Message' ) fn(data.id, ...data.message.value);
          if( data.message.type === 'Photo' ) fn({ chat_id: data.id, caption: data.message.value.caption, photo: data.message.value.photo });
          resolve(data);
        } catch(e) {
          reject(e);
        }
      }, 1000);
    });
  }  

  // GET /bot will only render a .json template file located in commands
  async get (data) {
    return new Promise((resolve, reject) => {
      setTimeout(()=> {
        let p = path.join(__dirname, 'commands', data.name+'.json');
        fs.readFile(p, 'utf8', function(err, content) {
          if (err) reject(err);
          content = content.toString();
          Object.keys(data.data).map(item => {
            content = content.replace('{{ '+item+' }}', data.data[item]);
          });
          content = JSON.parse(content);
          resolve(content);
        });
      }, 1000);
    });
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
