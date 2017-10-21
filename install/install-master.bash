#!/bin/bash


if ! [ -x "$(command -v git)" ]; then

  echo 'First, installing git'
  
  if [ -x "$(command -v dnf)" ]; then
    sudo dnf install git
  elif [ -x "$(command -v yum)" ]; then
    sudo yum install git
  elif [ -x "$(command -v apt-get)" ]; then
    sudo apt-get install git
  elif [ -x "$(command -v zypper)" ]; then
    sudo zypper install git
  else
    echo "Please first install git."
    exit 1
  fi

fi


git clone --branch master https://github.com/markriley9999/refPlayer.git
		   
		   
cd refPlayer/install
./install-2.sh
