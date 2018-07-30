const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({region: process.env.REGION});
const querystring = require('querystring');
const listObjects = require('../lib/listObjects');

module.exports.handler = function (event, context, callback) {
  var params = querystring.parse(event.body);

  return dynamoDB.updateItem({
    TableName: process.env.TABLE_NAME,
    UpdateExpression: 'SET active = :a, modification_date = :m',
    ExpressionAttributeValues: {
      ':a': {
        BOOL: params.active === 'true'
      },
      ':m': {
        S: (new Date(Date.now())).toISOString()
      }
    },
    Key: {
      'id': {
        S: params.id
      }
    }
  }, function (err, data) {
    if (err) return callback(err);

    return listObjects({}, {}, callback);
  });
};
