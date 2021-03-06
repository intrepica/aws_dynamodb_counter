'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noPreserveCache();
var nock = require('nock');

process.env.DYNAMO_REGION = 'us-east-1';
var Counter = require('../');

var mock = sinon.mock;
var stub = sinon.stub;

describe('aws_dynamodb_counter', function(){
  var games;  

  describe('when a RANGE_KEY is specified', function() {

    beforeEach(function() {            
      games = Counter('games', 'PRIMARY_INDEX_KEY', 'PRIMARY_INDEX_VAL', 'RANGE_KEY', 'RANGE_VAL');
    });

    it('sets the key instance to both the PRIMARY_INDEX_KEY and RANGE_KEY', function() {      
      expect(games.key).to.eql({ 
        'PRIMARY_INDEX_KEY': { S:'PRIMARY_INDEX_VAL' },
        "RANGE_KEY":{"S":"RANGE_VAL"}
      });
    });

    describe('#increment', function() {
      describe('when the id has not been counted', function() {
        beforeEach(function() {
          nock('https://dynamodb.us-east-1.amazonaws.com:443')
            .post('/', {
              "Key":{
                "PRIMARY_INDEX_KEY":{"S":"PRIMARY_INDEX_VAL"},
                "RANGE_KEY":{"S":"RANGE_VAL"}
              },
              "TableName":"games",
              "ConditionExpression":"attribute_not_exists(#id) or (NOT contains(#id, :id))",
              "UpdateExpression":"ADD #id :ss, #counter :counter",
              "ExpressionAttributeNames":{
                "#id":"id",
                "#counter":"counter"
              },
              "ExpressionAttributeValues":{
                ":id":{
                  "S":"SOME_UNIQUE_ID"
                },
                ":ss":{
                  "SS":["SOME_UNIQUE_ID"]
                },
                ":counter":{
                  "N":"10"
                }
              }
            })
            .reply(200);      
        }); 

        it('increments the counter', function(done) {
          games.increment({counter:10}, 'SOME_UNIQUE_ID', done);
        }); 
      });

      describe('when the id been counted already', function() {
        beforeEach(function() {
          nock('https://dynamodb.us-east-1.amazonaws.com:443')
            .post('/')
            .reply(400, {
              "__type":"com.amazonaws.dynamodb.v20120810#ConditionalCheckFailedException",
              "message":"The conditional request failed"
            });    
        }); 

        it('doesnt increment the counter', function(done) {
          games.increment({counter:10}, 'SOME_UNIQUE_ID', function(err) {
            expect(err).to.eql(null);
            done();
          });
        }); 
      });

      describe('when there is an error', function() {
        beforeEach(function() {
          nock('https://dynamodb.us-east-1.amazonaws.com:443')
            .post('/')
            .reply(400, { 
              "message":"A different errror"
            });    
        }); 

        it('calls back with the error', function(done) {
          games.increment({counter:10}, 'SOME_UNIQUE_ID', function(err) {
            expect(err.message).to.eql('A different errror');
            done();
          });
        }); 

        it('attaches the request to the error object', function(done) {
          games.increment({counter:10}, 'SOME_UNIQUE_ID', function(err) {          
            expect(err.dynamo_params).to.eql('{"Key":{"PRIMARY_INDEX_KEY":{"S":"PRIMARY_INDEX_VAL"},"RANGE_KEY":{"S":"RANGE_VAL"}},"TableName":"games","ConditionExpression":"attribute_not_exists(#id) or (NOT contains(#id, :id))","UpdateExpression":"ADD #id :ss, #counter :counter","ExpressionAttributeNames":{"#id":"id","#counter":"counter"},"ExpressionAttributeValues":{":id":{"S":"SOME_UNIQUE_ID"},":ss":{"SS":["SOME_UNIQUE_ID"]},":counter":{"N":"10"}}}');
            done();
          });
        });       
      });
    });

    describe('#decrement', function() {
      describe('when the id has been counted', function() {
        beforeEach(function() {
          nock('https://dynamodb.us-east-1.amazonaws.com:443')
            .post('/', {
              "Key":{
                "PRIMARY_INDEX_KEY":{"S":"PRIMARY_INDEX_VAL"},
                "RANGE_KEY":{"S":"RANGE_VAL"}
              },
              "TableName":"games",
              "ConditionExpression":"attribute_exists(#id) and contains(#id, :id)",
              "UpdateExpression":"DELETE #id :ss SET #counter = #counter - :counter",
              "ExpressionAttributeNames":{
                "#id":"id",
                "#counter":"counter"
              },
              "ExpressionAttributeValues":{
                ":id":{
                  "S":"SOME_UNIQUE_ID"
                },
                ":ss":{
                  "SS":["SOME_UNIQUE_ID"]
                },
                ":counter":{
                  "N":"10"
                }
              }
            })
            .reply(200);      
        }); 

        it('increments the counter', function(done) {
          games.decrement({counter:10}, 'SOME_UNIQUE_ID', done);
        }); 
      });

      describe('when the id has not been counted', function() {
        beforeEach(function() {
          nock('https://dynamodb.us-east-1.amazonaws.com:443')
            .post('/')
            .reply(400, {
              "__type":"com.amazonaws.dynamodb.v20120810#ConditionalCheckFailedException",
              "message":"The conditional request failed"
            });    
        }); 

        it('doesnt decrement the counter', function(done) {
          games.decrement({counter:1}, 'SOME_UNIQUE_ID', function(err) {
            expect(err).to.eql(null);
            done();
          });
        }); 
      });

      describe('when there is an error', function() {
        beforeEach(function() {
          nock('https://dynamodb.us-east-1.amazonaws.com:443')
            .post('/')
            .reply(400, { 
              "message":"A different errror"
            });    
        }); 

        it('calls back with the error', function(done) {
          games.decrement({counter:1}, 'SOME_UNIQUE_ID', function(err) {
            expect(err.message).to.eql('A different errror');
            done();
          });
        }); 

        it('attaches the request to the error object', function(done) {
          games.decrement({counter:1}, 'SOME_UNIQUE_ID', function(err) {          
            expect(err.dynamo_params).to.eql('{"Key":{"PRIMARY_INDEX_KEY":{"S":"PRIMARY_INDEX_VAL"},"RANGE_KEY":{"S":"RANGE_VAL"}},"TableName":"games","ConditionExpression":"attribute_exists(#id) and contains(#id, :id)","UpdateExpression":"DELETE #id :ss SET #counter = #counter - :counter","ExpressionAttributeNames":{"#id":"id","#counter":"counter"},"ExpressionAttributeValues":{":id":{"S":"SOME_UNIQUE_ID"},":ss":{"SS":["SOME_UNIQUE_ID"]},":counter":{"N":"1"}}}');
            done();
          });
        });       
      });
    });
  });

  describe('when a RANGE_KEY is NOT specified', function() {
    it('sets the key instance to only the PRIMARY_INDEX_KEY', function() {
      games = Counter('games', 'PRIMARY_INDEX_KEY', 'PRIMARY_INDEX_VAL');
      expect(games.key).to.eql({ 'PRIMARY_INDEX_KEY': { S:'PRIMARY_INDEX_VAL' } });
    });
  });
});
