#!/bin/bash

CMD=$1

if [ "$CMD" == "update" ]; then
  echo " - Update code"
  git pull https://github.com/markriley9999/refPlayer.git master
  echo " - (Re)install node modules"
  sudo npm install
fi

./electron .

