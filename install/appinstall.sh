#!/bin/bash

APP=$1

if ! [ -x "$(command -v $APP)" ]; then

  echo Installing: $APP
  
  if [ -x "$(command -v dnf)" ]; then
    sudo dnf install $APP
  elif [ -x "$(command -v yum)" ]; then
    sudo yum install $APP
  elif [ -x "$(command -v apt-get)" ]; then
    sudo apt-get install $APP
  elif [ -x "$(command -v zypper)" ]; then
    sudo zypper install $APP
  else
    echo Cannot install $APP
    exit 1
  fi

fi

