#!/bin/bash

CMD=$1

if [ -e title.txt ]; then
    cat title.txt
fi


if [ "$CMD" == "--updatenode" ]; then
  sudo npm cache clean -f
  sudo npm install -g n
  sudo n stable
  exit 0
fi


if [ "$CMD" == "--update" ]; then
  echo " - Update code"
  git stash
  git pull
  echo " - (Re)install node modules"
  npm install
  echo Done.
  ./install/getcontent-duk-aws.sh
  exit 0
fi


if [ "$CMD" == "--getallcontent" ]; then
  echo " - Get content"
  cd install/
  ./install/getcontent-duk-aws.sh --getallcontent
  exit 0
fi

npm start -- "$@"
