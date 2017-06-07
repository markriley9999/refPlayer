#!/bin/bash

cd ..

if ! [ -x "$(command -v nodejs)" ]; then

  echo 'First, installing nodejs'
  
  if [ -x "$(command -v dnf)" ]; then
    dnf install nodejs
  elif [ -x "$(command -v yum)" ]; then
    yum install nodejs
  elif [ -x "$(command -v apt-get)" ]; then
    apt-get install nodejs
  else
    echo "Please first install nodejs."
    exit 1
  fi

fi

npm install
ln -s ./node_modules/.bin/electron

cd install/

