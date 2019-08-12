const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({region: process.env.REGION});
const handlebars = require('handlebars');
const fs = require('fs');

module.exports = (event, context, callback) => {
  const format = event.queryStringParameters && event.queryStringParameters.format;
  const template = format === 'json' ? 'json-template.hbs' : 'html-template.hbs';
  const uploaded = event.queryStringParameters && event.queryStringParameters.uploaded;

  dynamoDB.scan({
    TableName: process.env.TABLE_NAME
  }, function (err, data) {
    if (err) return callback(err);
    var templateData = Object.assign({}, data, {
      bucket: process.env.S3_BUCKET,
      stage: process.env.STAGE,
      region: process.env.REGION,
      uploaded: uploaded
    });
    templateData.Items.sort(function (a, b) {
      a = new Date(a.modificationDate.S);
      b = new Date(b.modificationDate.S);
      return a > b ? -1 : a < b ? 1 : 0;
    });
    const body = handlebars.compile(
      fs.readFileSync(__dirname + '/../templates/' + template, 'utf8')
    )(templateData);

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html'
      },
      body: body
    };

    return callback(null, response);
  });
};
