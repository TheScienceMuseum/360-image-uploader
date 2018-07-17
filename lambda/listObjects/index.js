const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB({region: 'eu-west-2'});
const handlebars = require('handlebars');
const fs = require('fs');
const template = handlebars.compile(fs.readFileSync('./template.hbs', 'utf8'));

exports.handler = (event, context, callback) => {
  dynamoDB.scan({
    TableName: "360Images",
  }, function(err, data) {
    if (err) return callback(err);

    const html = template(data);

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html'
      },
      body: html
    };

    return callback(null, response);
  });
}
