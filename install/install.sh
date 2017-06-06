#!/bin/bash

sudo dnf install git


git config --global user.name "manufacturer"
git config --global user.email manufacturer@digitaluk.co.uk
git clone https://github.com/markriley9999/refPlayer.git refPlayer

cd refPlayer/install
./install-2.sh

