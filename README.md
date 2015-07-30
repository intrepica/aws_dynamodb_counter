Aws DynamoDb Counter
====================

Increments or decrements a counter in Dynamodb. The counter is atomic and idempotent.

increment( table (dynamo table) , key (primary key in table to increment), keyValue, object containing (field name):(increment by) key vals, unique id of event (md5 of the event object) )


Example
--------------

```js

  'use strict';

    var Counter = require('./counter')('wordmaniaUserGames-staging', 'PRIMARY_KEY', 'KEY_VALUE');

    Counter.increment({ words:10, games:1 }, '55ad340609f4b302', function(err) {
        if (err) {
            throw err;
        }

        // Success!
    });


    Counter.decrement({ words:10, games:1 }, '55ad340609f4b302', function(err) {
        if (err) {
            throw err;
        }

        // Success!
    });

```
