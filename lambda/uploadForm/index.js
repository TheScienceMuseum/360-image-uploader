const handlebars = require('handlebars');
const fs = require('fs');

module.exports.handler = (event, context, callback) => {
  const body = handlebars.compile(fs.readFileSync(__dirname + '/../templates/upload-form.hbs', 'utf8'))({});

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html'
    },
    body: body
  };

  return callback(null, response);
}
