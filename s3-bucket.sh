#!/bin/bash

while getopts ":b:" opt; do
  case $opt in
    b)
      aws s3api create-bucket --bucket $OPTARG --region eu-west-1 --create-bucket-configuration LocationConstraint=eu-west-1 --profile default
      aws s3 cp index.html s3://$OPTARG/index.html --profile default
      aws s3api put-bucket-policy --bucket $OPTARG --policy "{
          \"Version\": \"2012-10-17\",
          \"Statement\": [
              {
                  \"Effect\": \"Allow\",
                  \"Principal\": \"*\",
                  \"Action\": \"s3:GetObject\",
                  \"Resource\": \"arn:aws:s3:::${OPTARG}/*\"
              }
          ]
      }" --profile default
      aws s3 website s3://$OPTARG --index-document index.html --profile default
      exit 0
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

echo "Must provide bucket name with -b"
exit 1
