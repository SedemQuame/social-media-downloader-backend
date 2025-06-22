#!/bin/bash

# Set your Heroku app name here
HEROKU_APP_NAME="social-media-downloader-bcknd"

echo "Logging into Heroku CLI..."
heroku login

echo "Creating Heroku app (if it doesn't exist)..."
heroku apps:info -a $HEROKU_APP_NAME > /dev/null 2>&1
if [ $? -ne 0 ]; then
  heroku create $HEROKU_APP_NAME
else
  echo "Heroku app already exists: $HEROKU_APP_NAME"
fi

echo "Connecting Git remote..."
heroku git:remote -a $HEROKU_APP_NAME

echo "Pushing code to Heroku..."
git push heroku main

echo "Setting environment variables from local .env..."
while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ "$line" =~ ^#.* ]] || [[ -z "$line" ]]; then
    continue
  fi
  heroku config:set "$line" -a $HEROKU_APP_NAME
done < .env

echo "Deployment complete!"
heroku open -a $HEROKU_APP_NAME