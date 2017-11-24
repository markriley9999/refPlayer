#!/bin/bash

CMD=$1

if [ "$CMD" == "--update" ]; then
  echo " - Update code"
  git stash
  git pull
  echo " - (Re)install node modules"
  npm install
  echo Done.
  exit 0
fi

npm start -- "$@"
