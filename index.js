var AWS = require('aws-sdk');

AWS.config.update({region: process.env.DYNAMO_REGION});
AWS.config.apiVersion = '2012-08-10';

var dynamodb = new AWS.DynamoDB();

module.exports = function setup(table, hashKeyName, hashKeyValue, rangeKey, rangeKeyValue) {
  return new Counter(table, hashKeyName, hashKeyValue, rangeKey, rangeKeyValue);
};

function Counter(table, hashKeyName, hashKeyValue, rangeKey, rangeKeyValue) {
  this.table = table;  
  this.key = {};
  var key = this.key[hashKeyName] = {};
  key['S'] = hashKeyValue; // Currently only works for string keys.

  if (rangeKey) {
    var rKey = this.key[rangeKey] = {};
    rKey['S'] = rangeKeyValue
  }
}

Counter.prototype.increment = function(fieldsToIncrement, id, callback) {
  this.updateItem('ADD', fieldsToIncrement, id, callback);
};

Counter.prototype.decrement = function(fieldsToDecrement, id, callback) {
  this.updateItem('DELETE', fieldsToDecrement, id, callback);
};

Counter.prototype.updateItem = function(action, fields, id, callback) {
  var expressionAttributeNames = {
    '#id': 'id'
  };

  var expressionAttributeValues = {      
    ':id': { S: id },
    ':ss': { SS: [id] }
  };

  var keyExpressions =  [];

  Object.keys(fields).forEach(function(field) {
    var attrName = '#' + field;
    expressionAttributeNames[attrName] = field;

    var attrValue = ':' + field;
    expressionAttributeValues[attrValue] = { 'N': String(fields[field]) }

    if(action === 'ADD') {
      keyExpressions.push(attrName + ' ' + attrValue);
    } else {
      keyExpressions.push(attrName + ' = ' + attrName + ' - ' + attrValue);
    }    
  });

  var updateExpression, conditionExpression;

  if (action == 'ADD') {
    updateExpression = 'ADD #id :ss, ' + keyExpressions.join(',');
    conditionExpression = 'attribute_not_exists(#id) or (NOT contains(#id, :id))';
  } else {
    updateExpression = 'DELETE #id :ss SET ' + keyExpressions.join(',');
    conditionExpression = 'attribute_exists(#id) and contains(#id, :id)';
  }

  var params = {
    Key: this.key,
    TableName: this.table,
    ConditionExpression: conditionExpression,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  };

  dynamodb.updateItem(params, function(err) {    
    if (err && err.code === 'ConditionalCheckFailedException') {
      return callback(null);
    } else if (err) {
      err.dynamo_params = JSON.stringify(params);
      return callback(err);
    }
    callback();
  });
}


