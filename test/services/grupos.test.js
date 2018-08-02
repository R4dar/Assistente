const assert = require('assert');
const app = require('../../src/app');
const service = app.service('grupos');
const should = require('should')

describe('\'grupos\' service', () => {
    let id = null
    
    it('registered the service', () => {
	assert.ok(service, 'Registered the service');
    });

    it('create a grupo, and this use should receive a message', () => {
	service.create({
	    name: 'Grupo teste',
	    tags: ['test', 'feathers', 'grupo']
	}).then(function(res){
	    res.should.be.ok()
	}).catch(function(err){
	    assert.fail(err)
	})
    });

    it('get a list of grupos', () => {
	service.find({}).then(function(res){
	    res.total.should.exists()
	    res.total.should.be.equal(1)
	    res.data.should.be.Array()
	    res.data.length.should.be.equal(1)
	    let props = ['name', 'tags', 'users']
	    for(let i in props) {
		res.data[0].should.have.property(props[i])
	    }
	    id = res.data[0]._id
	    assert.ok(id, 'Found 1 grupo')
	}).catch(function(err){
	    assert.fail(err)
	})
    });

    it('get a grupo', () => {
	service.get(id).then(function(res){
	    assert.ok(res, 'getted grupo')
	}).catch(function(err){
	    assert.fail(err)
	})
    })

    
    it('patch a grupo', () => {
	app.service('users').find({}).then(function(res){
	    let patch = {users: []}
	    patch.users = res.data.map(item => { return item._id })
	    return service.patch(id, patch)
	}).then(function(res){
	    assert.ok(res, 'patched grupo')
	}).catch(function(err){
	    assert.fail(err)
	})
    })
});
