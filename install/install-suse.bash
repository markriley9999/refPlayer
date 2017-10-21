#!/bin/bash

sudo zypper install git
git clone --branch master https://github.com/markriley9999/refPlayer.git


sudo zypper install libgtk*
sudo zypper install libXss*
sudo zypper install libgconf*
sudo zypper install libnss*
sudo zypper install libasound*
sudo zypper install xauth 
sudo zypper install xorg-x11-server

curl -o refPlayer/xvfb-run.sh http://ftp.engsas.de/tipsandtricks/xvfb/xvfb-run.opensuse
chmod +x refPlayer/xvfb-run.sh

		   
cd refPlayer/install
./install-2.sh


echo
echo
echo *** Please Edit AWS 'inbound rules' - add port 8080 ***
echo To run in headless mode: './xvfb-run.sh ./run.sh --headless &'

