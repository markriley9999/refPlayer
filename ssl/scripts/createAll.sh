#!/bin/bash

./cleanRoot.sh
./cleanCSR.sh

echo "*** Create Root Certificate ****"
echo
./createRoot.sh


read -p "Press enter to continue"
echo "**** Create Server CSR ****"
echo
./createCSR.sh

read -p "Press enter to continue"
echo "**** Sign Certifcate ****"
echo
./signServer.sh

./setPermissions.sh

