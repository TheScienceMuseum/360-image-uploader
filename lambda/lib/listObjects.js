const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({region: 'eu-west-1'});
const handlebars = require('handlebars');
const fs = require('fs');

module.exports = (event, context, callback) => {
  const format = event.queryStringParameters && event.queryStringParameters.format;
  const template = format === 'json' ? 'json-template.hbs' : 'html-template.hbs';

  dynamoDB.scan({
    TableName: process.env.TABLE_NAME
  }, function (err, data) {
    if (err) return callback(err);

    const body = handlebars.compile(fs.readFileSync(__dirname + '/../templates/' + template, 'utf8'))(data);

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
