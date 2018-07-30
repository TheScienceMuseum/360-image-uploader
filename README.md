# 360-image-uploader

A collection of lambdas to upload, unzip and store in DynamoDB The Science Museum's 360 image files (.ggpkg format).

## Deployment

We're using serverless to handle the deployment, so everything is handled in our serverless.yml file.

See here to install serverless to your machine.

To deploy, simply run:

```
sls deploy --bucket {bucket-name} --region {aws-region} --stage {stage-name}
```

All three of the flags are optional, they will default to the following if not included:

* bucket - smgco-360
* region - eu-west-1
* stage - dev

To take down the services, run the exact same command, but replace `deploy` with `remove`.

```
sls remove --bucket {bucket-name} --region {aws-region} --stage {stage-name}
```

If you have anything in the {bucket-name} s3 bucket, the removal may fail, and you may have to delete the remaining resources manually.

To do this, go to s3, empty the bucket and delete it. Then go to CloudFormation and delete the CloudFormation stack. It will be called `smgco-360-uploader-{stage-name}`

## Accessible Endpoints

`/` - Returns an html form to be used to upload .ggpkg files to s3.

`/list-objects` - Returns an html table of all the 360 files in s3.

`/list-objects?format=json` - Returns a json list of all the 360 files in s3.
