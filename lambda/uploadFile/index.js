var multipart = require('parse-multipart');
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

module.exports.handler = function(event, context, callback) {
  var bodyBuffer = new Buffer(event['body-json'].toString(), 'base64');
  var boundary = multipart.getBoundary(event.params.header['content-type']);

  var parts = multipart.Parse(bodyBuffer, boundary);

  return s3.putObject({
    Bucket: '360-lm-test',
    Key: 'tmp.zip',
    Body: parts[0].data,
    ACL: 'public-read'
  }, function (err, resp) {
    if (err) return callback(err);
    console.log('Successfully uploaded');
    return callback(null, {result: 'SUCCESS', files: parts});
  });
}
