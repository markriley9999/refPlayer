#!/bin/bash

if ! [ -x "$(command -v git)" ]; then

  echo 'First, installing git'
  
  if [ -x "$(command -v dnf)" ]; then
    dnf install git
  elif [ -x "$(command -v yum)" ]; then
    yum install git
  elif [ -x "$(command -v apt-get)" ]; then
    apt-get install git
  else
    echo "Please first install git."
    exit 1
  fi

fi


git config --global user.name "manufacturer"
git config --global user.email manufacturer@digitaluk.co.uk
git clone https://github.com/markriley9999/refPlayer.git refPlayer

cd refPlayer/install
./install-2.sh "#@"

