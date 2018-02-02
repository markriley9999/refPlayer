#!/bin/bash


if ! [ -x "$(command -v git)" ]; then

  echo 'First, installing git'
  
  if [ -x "$(command -v dnf)" ]; then
    sudo dnf -y install git
  elif [ -x "$(command -v yum)" ]; then
    sudo yum -y install git
  elif [ -x "$(command -v apt-get)" ]; then
    sudo apt-get -y install git
  elif [ -x "$(command -v zypper)" ]; then
    sudo zypper install -y git
  else
    echo "Please first install git."
    exit 1
  fi

fi


git clone --branch FormalRelease --single-branch https://github.com/markriley9999/refPlayer.git --depth 1
		   
		   
cd refPlayer/install
./install-2.sh

