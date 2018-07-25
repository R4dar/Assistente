const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('winston');
const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const reconfigure = require('./reconfigure');
const express = require('@feathersjs/express');
const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');
const mongoose = require('./mongoose');
const authentication = require('./authentication');
const uploads = require('./uploads');
const swagger = require('feathers-swagger');
const dotenv = require('dotenv')
const mongoUriBuilder = require('mongo-uri-builder');
const qs = require('querystring');
const fs = require('fs')

// now start
const app = express(feathers());

// Load app configuration
app.configure(configuration())

// Reconfigure
dotenv.config()
app.set('host', app.get('host').replace(/HOST/, process.env.HOST))
app.set('port', app.get('port').replace(/PORT/, process.env.PORT))
let url = mongoUriBuilder({
    host: process.env.MONGODB_USER+':'+qs.escape(process.env.MONGODB_PWD)+'@'+process.env.MONGODB_HOST,
    port: process.env.MONGODB_PORT,
    database: 'assistente'
});
app.set('mongodb', app.get('mongodb').replace(/MONGODB_URL/, url))
let auth = app.get('authentication')
auth.secret = auth.secret.replace(/AUTHENTICATION_SECRET/, process.env.AUTHENTICATION_SECRET)
auth.jwt.audience = auth.jwt.audience.replace(/AUDIENCE/, process.env.AUDIENCE)
auth.telegram.username = auth.telegram.username.replace(/TELEGRAM_USERNAME/, process.env.TELEGRAM_USERNAME)
auth.telegram.token = auth.telegram.token.replace(/TELEGRAM_TOKEN/, process.env.TELEGRAM_TOKEN)
auth.telegram.admins = process.env.TELEGRAM_ADMINS.split(' ').map(item => { return item })
auth.openid.clientID = auth.openid.clientID.replace(/OPENID_CLIENT_ID/, process.env.OPENID_CLIENT_ID)
auth.openid.clientSecret = auth.openid.clientSecret.replace(/OPENID_CLIENT_SECRET/, process.env.OPENID_CLIENT_SECRET)
app.set('authentication', auth)

// Enable CORS, security, compression, favicon and body parsing
app.use(cors());
app.use(helmet());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));

// Reconfigure public/index.html
app.engine('tml', function (filePath, options, callback) {
    fs.readFile(filePath, function(err, content){
	if(!err){
	    content = content.toString()
	    content = content.replace('{{ TELEGRAM_USERNAME }}', options.TELEGRAM_USERNAME)
	    content = content.replace('{{ AUDIENCE }}', options.AUDIENCE)
	    content = content.replace('{{ TITLE }}', options.TITLE)
	    content = content.replace('{{ TITLE }}', options.TITLE)
	    callback(null, content)
	} else {
	    callback(err)
	}
    })
})
app.set('views', path.join(__dirname, 'views')) // specify the views directory
app.set('view engine', 'tml')

// Host the public folder
app.use(express.static(app.get('public')))
app.get('/', function(req, res){
    logger.debug('Show index')
    let json = {
	TITLE: 'R4dar-Assistente REST API',
	TELEGRAM_USERNAME: app.get('authentication').telegram.username,
	AUDIENCE: app.get('authentication').jwt.audience
    }
    res.render('index', json)
})
// Configure Swagger Api
const _swagger_ = app.get('swagger')
_swagger_["uiIndex"] = path.join(__dirname, '..', _swagger_["uiIndex"])
app.configure(swagger(_swagger_))
    
// Set up Plugins and providers
app.configure(express.rest());
app.configure(mongoose);

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
app.configure(uploads);

// Set up our services (see `services/index.js`)
app.configure(services);

// Set up event channels (see channels.js)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));
app.hooks(appHooks);

// Go
module.exports = app;
