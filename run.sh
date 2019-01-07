#!/bin/bash

CMD=$1
CURRENTVERSION=$(./install/getversion.sh)

if [ -e title.txt ]; then
    cat title.txt
fi


if [ "$CMD" == "--updatenode" ]; then
  sudo npm cache clean -f
  sudo npm install -g n
  sudo n stable
  exit 0
fi


if [ "$CMD" == "--update" ] || [ "$CMD" == "--updateall" ] || [ "$CMD" == "--updateinc" ] ; then
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

  if [ "$CMD" == "--updateinc" ]; then
    echo " - Get content"
    cd install/
	./incupdate.sh "$CURRENTVERSION"
  fi

  exit 0
fi

npm start -- "$@"
