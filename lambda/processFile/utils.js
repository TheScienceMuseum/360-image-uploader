/*
Copyright (c) 2017 Steve Yardumian

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB({region: process.env.REGION});
const AdmZip = require('adm-zip');
const fs = require('fs');
const dateTime = require('date-time');
const md5 = require('md5');
const mime = require('mime-types');
const parseString = require('xml2js').parseString;
const uuid = require('uuid/v4');

const decompress = function (/* String */command, /* Function */ cb) {
  if (!command.bucket || !command.file) { // bucket and file are required
    if (cb) cb(new Error('Error: missing either bucket name or full filename!'));
    else console.error('Error: missing either bucket name or full filename!');
    return;
  }

  var filenamePartsArray = command.file.split('.');
  var foldername = filenamePartsArray[0];

  s3.getObject(
    {
      Bucket: command.bucket,
      Key: foldername + '/'
    }, function (err, data) {
      if (data) {
        // TODO: if called via command line, ask here to overwrite the data and prompt for response
        // console.log("Folder '"+foldername+"' already exists!");
      }

      s3.getObject(
        {
          Bucket: command.bucket,
          Key: command.file
        }, function (err, data) {
          if (err) {
            if (cb) cb(new Error('File Error: ' + err.message));
            else console.error('File Error: ' + err.message);
          } else {
            if (command.verbose) console.log("Zip file '" + command.file + "' found in S3 bucket!");

            // write the zip file locally in a tmp dir
            var tmpZipFilename = md5(dateTime({showMilliseconds: true}));
            fs.writeFileSync('/tmp/' + tmpZipFilename + '.zip', data.Body);

            // check that file in that location is a zip content type, otherwise throw error and exit
            if (mime.lookup('/tmp/' + tmpZipFilename + '.zip') !== 'application/zip') {
              if (cb) cb(new Error('Error: file is not of type zip. Please select a valid file (filename.zip).'));
              else console.error('Error: file is not of type zip. Please select a valid file (filename.zip).');
              fs.unlinkSync('/tmp/' + tmpZipFilename + '.zip');
              return;
            }

            // find all files in the zip and the count of them
            var zip = new AdmZip('/tmp/' + tmpZipFilename + '.zip');
            var zipEntries = zip.getEntries();
            var zipEntryCount = Object.keys(zipEntries).length;

            // if no files found in the zip
            if (zipEntryCount === 0) {
              if (cb) cb(new Error('Error: the zip file was empty!'));
              else console.error('Error: the zip file was empty!');
              fs.unlinkSync('/tmp/' + tmpZipFilename + '.zip');
              return;
            }

            // for each file in the zip, decompress and upload it to S3; once all are uploaded, delete the tmp zip and zip on S3
            var counter = 0;

            validateObject(zipEntries, function (err, object) {
              if (err) {
                console.log('Error: ', err);
              }

              zipEntries.forEach(function (zipEntry) {
                s3.upload({ Bucket: command.bucket, Key: object.id + '/' + zipEntry.entryName, Body: zipEntry.getData() }, function (err, data) {
                  counter++;

                  if (err) {
                    if (cb) cb(new Error('Upload Error: ' + err.message));
                    else console.error('Upload Error: ' + err.message);
                    fs.unlinkSync('/tmp/' + tmpZipFilename + '.zip');
                    return;
                  }

                  if (command.verbose) console.log('File decompressed to S3: ' + data.Location);

                  // if all files are unzipped...
                  if (zipEntryCount === counter) {
                    // delete the tmp (local) zip file
                    fs.unlinkSync('/tmp/' + tmpZipFilename + '.zip');

                    if (command.verbose) console.log('Local temp zip file deleted.');

                    // delete the zip file up on S3
                    if (command.deleteOnSuccess) {
                      s3.deleteObject({Bucket: command.bucket, Key: command.file}, function (err, data) {
                        if (err) {
                          if (cb) cb(new Error('Delete Error: ' + err.message));
                          else console.error('Delete Error: ' + err.message);
                          return;
                        }

                        if (command.verbose) console.log("S3 file '" + command.file + "' deleted.");

                        // WE GOT TO THE END
                        cb(null, 'Success!');
                      });
                    } else {
                      // WE GOT TO THE END
                      cb(null, 'Success!');
                    }
                  }
                });
              });
            });
          }
        }
      );
    }
  );
};

function validateObject (files, callback) {
  var xmlFile = files.find(f => f.entryName === 'object.xml');

  if (!xmlFile) {
    return callback('No object.xml file found');
  }

  var xmlString = xmlFile.getData().toString();

  return parseString(xmlString, function (err, result) {
    if (err) {
      return callback('Xml could not be parsed');
    }
    const data = result.vrobject.userdata || [{'$': {}}];

    return saveToDB({title: data[0]['$'].title, objectId: data[0]['$'].info}, callback);
  });
}

function saveToDB (item, callback) {
  const id = uuid();
  let params = {
    'id': {
      S: id
    },
    'active': {
      BOOL: (item.objectId && item.title) ? true : false
    },
    'modificationDate': {
      S: (new Date(Date.now())).toISOString()
    }
  };

  if (item.objectId) {
    params.objectId = {S: item.objectId}
  }

  if (item.title) {
    params.title = {S: item.title}
  }

  return dynamoDB.putItem({
    TableName: process.env.TABLE_NAME,
    Item: params
  }, function (err, data) {
    if (err) return callback(err);
    return callback(null, Object.assign({}, item, {id: id}));
  });
}

module.exports = { decompress };
