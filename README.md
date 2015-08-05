Aws DynamoDb Counter
====================

Increments or decrements a counter in Dynamodb. The counter is atomic and idempotent. It works by saving the id in a string set and only incrementing the counter if the id is present in the set and only decrementing the counter when the id is present in the set.

[![Build Status](https://semaphoreci.com/api/v1/projects/12aacbe8-02c5-4d28-8b7a-fb989f4f7ded/500402/badge.svg)](https://semaphoreci.com/lp/aws_dynamodb_counter)     

Example
--------------

### Counter(table, hashKeyName, hashKeyValue, [rangeKey, rangeKeyValue])

table - dynamo table

hashKeyName - hash key in table to increment

hashKeyValue - hash key value

rangeKey - range key in table to increment

rangeKeyValue - range key value

```js
    var Counter = require('./counter')('dbName', 'HASH_KEY', 'HASH_KEY_VALUE');
```


### increment(fieldsToIncrement, id, callback)

fieldsToIncrement - object containing (field name):(increment by) key vals to increment by

id = unique id of event (md5 of the event object)

```
    UpdateExpression: ADD #id :ss, #counter :increment_by
    ConditionExpresssion: attribute_not_exists(#id) or (NOT contains(#id, :id))
```


```js
    Counter.increment({ words:10, games:1 }, '55ad340609f4b302', function(err) {
        if (err) {
            throw err;
        }

        // Success!
    });

```


### decrement(fieldsToDecrement, id, callback)

fieldsToDecrement - object containing (field name):(increment by) key vals to increment by

id = unique id of event (md5 of the event object)

```
   UpdateExpression: DELETE #id :ss SET #counter = #counter - :decrement_by
   ConditionExpresssion: attribute_exists(#id) and contains(#id, :id)
```


```js
    Counter.decrement({ words:10, games:1 }, '55ad340609f4b302', function(err) {
        if (err) {
            throw err;
        }

        // Success!
    });

```
