const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({region: 'eu-west-1'});
const querystring = require('querystring');
const lambda = new AWS.Lambda({region: 'eu-west-1'});
const listObjects = require('../lib/listObjects');

module.exports.handler = function (event, context, callback) {
  var params = querystring.parse(event.body);

  return dynamoDB.updateItem({
    TableName: process.env.TABLE_NAME,
    UpdateExpression: 'SET active = :a',
    ExpressionAttributeValues: {
      ':a': {
        BOOL: params.active === 'true'
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
