#!/bin/bash

CMD=$1

if [ "$CMD" == "--update" ] || [ "$CMD" == "--updateall" ]; then
  echo " - Update code"
  git stash
  git pull
  echo " - (Re)install node modules"
  npm install
  echo Done.

  if [ "$CMD" == "--updateall" ]; then
    echo " - Get content"
    cd install/
	./getcontent-duk-aws.sh
  fi

  exit 0
fi

npm start -- "$@"
