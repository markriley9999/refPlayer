#!/bin/bash

cd ..

mkdir -p server/private server/csr



# Create key
echo
echo " - Create Server Key -"
echo

openssl genrsa -aes256 \
      -out server/private/refPlayer.key.pem 2048

# remove password	  
openssl rsa -in server/private/refPlayer.key.pem -out server/private/refPlayer.key.pem

# Create cert
echo
echo " - Create Server Certificate -"
echo

openssl req -config config/openssl-san.cnf \
	  -extensions server_cert \
      -key server/private/refPlayer.key.pem \
      -new -sha256 -out server/csr/refPlayer.csr.pem

