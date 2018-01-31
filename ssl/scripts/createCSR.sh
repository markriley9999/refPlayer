#!/bin/bash

cd ~/refPlayer/ssl/

mkdir -p server/private server/csr


# Create key
echo
echo " - Create Server Key -"
echo

openssl genrsa -aes256 \
      -out server/private/refPlayer.key.pem 2048


# Create cert
echo
echo " - Create Server Certificate -"
echo

openssl req -config config/openssl.cnf \
      -key server/private/refPlayer.key.pem \
      -new -sha256 -out server/csr/refPlayer.csr.pem

