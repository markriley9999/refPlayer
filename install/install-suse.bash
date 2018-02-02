#!/bin/bash


sudo zypper install -y git
git clone --branch master https://github.com/markriley9999/refPlayer.git


sudo zypper install -y libgtk*
sudo zypper install -y libXss*
sudo zypper install -y libgconf*
sudo zypper install -y libnss*
sudo zypper install -y libasound*
sudo zypper install -y xauth 
sudo zypper install -y xorg-x11-server

curl -o refPlayer/xvfb-run.sh http://ftp.engsas.de/tipsandtricks/xvfb/xvfb-run.opensuse
chmod +x refPlayer/xvfb-run.sh

		   
cd refPlayer/install
./install-2.sh


echo
echo
echo *** Please Edit AWS 'inbound rules' - add port 8080 ***
echo To run in headless mode: './xvfb-run.sh ./run.sh --headless &'

