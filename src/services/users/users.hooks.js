const { authenticate } = require('@feathersjs/authentication').hooks;
const {
  hashPassword, protect
} = require('@feathersjs/authentication-local').hooks;
const sendToken = require('./users.hooks.sendToken')
const logger = require('winston')

module.exports = {
  before: {
    all: [],
    find: [ 
	authenticate('jwt')
    ],
    get: [ 
	authenticate('jwt')
    ],
    create: [
    ],
    update: [ 
	authenticate('jwt')
    ],
    patch: [
	authenticate('jwt') 
    ],
    remove: [ 
	authenticate('jwt')
    ]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [sendToken('default')],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
