var AWS = require('aws-sdk');

AWS.config.update({region: process.env.DYNAMO_REGION});
AWS.config.apiVersion = '2012-08-10';

var dynamodb = new AWS.DynamoDB();

// Counter = require('./counter')('wordmaniaUserGames-staging', 'user_id', 'A23894');
// Counter.increment({ words:10, games:1 }, '55ad340609f4b302', console.log);

// increment( table (dynamo table) , key (primary key in table to increment eg. user_Id), keyValue, object containing (field name):(increment by) key vals, unique id of event (md5 of the event object) )

// Example:
// event = { timestame:2142155263, user_id:'A2992442', score:325  }
// id = md5(event)
// key = event.user_id
// table = 'gameCounts'
// increment(table, key, id)
//  or
// decrement(table, key, id)

module.exports = function setup(table, keyName, keyValue) {
  return new Counter(table, keyName, keyValue);
};

function Counter(table, keyName, keyValue) {
  this.table = table;  
  this.key = {};
  var key = this.key[keyName] = {};
  key['S'] = keyValue; // Currently only works for string keys.
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

  dynamodb.updateItem(params, callback);
}


