const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({region: process.env.REGION});
const querystring = require('querystring');
const listObjects = require('../lib/listObjects');
const s3 = new AWS.S3({region: process.env.REGION});

module.exports.handler = function (event, context, callback) {
  var params = querystring.parse(event.body);

  return dynamoDB.deleteItem({
    TableName: process.env.TABLE_NAME,
    Key: {
      'id': {
        S: params.id
      }
    }
  }, function (err, data) {
    if (err) return callback(err);

    return s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: params.id
    }, function(err, data) {
      if (err) return callback(err);

      return listObjects({}, {}, callback);
    });
  });
};
