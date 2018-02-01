#!/bin/bash

set -e

./cleanRoot.sh
./cleanCSR.sh

echo "*** Create Root Certificate ****"
echo
./createRoot.sh
read -p "Press enter to continue"

echo
echo " - Please enter Subject Alternative Name (SAN)"
echo "   This is the URL / IP address of the server, eg:"
echo "      - URL enter 'DNS:[URL]', eg 'DNS:*.cloud.digitaluk.co.uk'"
echo "      - IP address 'IP:[addrress]', eg 'IP:192.168.143.28'"
echo

read -p "SAN: " SAN

if [ -z "$SAN" ]; then
	echo "Error: must enter SAN details!"
	exit 1
fi

export SAN
#export SAN="DNS:*.cloud.digitaluk.co.uk,IP:192.168.143.28"
echo "SubjectAltName: " $SAN


read -p "Press enter to continue"
echo "**** Create Server CSR ****"
echo
./createCSR.sh 

read -p "Press enter to continue"
echo "**** Sign Certifcate ****"
echo
./signServer.sh

./setPermissions.sh

