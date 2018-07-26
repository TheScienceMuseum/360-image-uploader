const handlebars = require('handlebars');
const fs = require('fs');

const AWS = require('aws-sdk');
const s3 = new AWS.S3({region: process.env.REGION});

module.exports.handler = (event, context, callback) => {
  let body;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Fields: {
      acl: 'public-read',
      success_action_redirect: `https://${event.headers.Host}/${process.env.STAGE}/list-objects`
    },
    Conditions: [
    ['starts-with', '$key', '']
  ]
  };

  s3.createPresignedPost(params, (error, data) => {
    if (error) {
      callback(error);
    } else {
      data.fields.key = '${filename}';
      body = handlebars.compile(fs.readFileSync(__dirname + '/../templates/upload-form.hbs', 'utf8'))(data);
      const response = {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html'
        },
        body: body
      };

      return callback(null, response);
    }
  });
}
