var should = require('should');

var asmx;
describe('asmx', function () {
   
    it('should be able to require', function () {
        asmx = require('../');
    });

    it('should have Client', function () {
        asmx.should.have.property('Client');
    });

    it('should require parameter baseUri to instanciate', function () {
        var test = function () {
            var client = new asmx.Client();    
        };
        test.should.throw();
    });


    describe('instance of asmx.Client', function () {
        it('should have function callWebMethod', function () {
            var client = new asmx.Client('asdf');
            client.should.have.property('callWebMethod');
            client.callWebMethod.should.be.a.Function;
        });
    });
});