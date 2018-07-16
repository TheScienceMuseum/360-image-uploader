"use strict";

var utils = require('./utils.js');

exports.handler = (event, context) => {
    var bucket = event.Records[0].s3.bucket.name;
    var object = event.Records[0].s3.object.key;

    return utils.decompress({
      bucket: bucket,
      file: object,
      deleteOnSuccess: true,
      verbose: false
    }, function(err, success){
      if (err) console.error("Error:", err);
      else console.log("Success", success);
    });
};
