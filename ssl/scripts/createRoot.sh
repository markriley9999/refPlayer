#!/bin/bash

cd ~/refPlayer/ssl/

mkdir -p root/certs root/crl root/newcerts root/private

touch root/index.txt.attr
touch root/index.txt

echo 1000 > root/serial


# Create key
echo
echo " - Create Key -"
echo

openssl genrsa -aes256 -out root/private/ca.key.pem 4096


# Create root cert
echo
echo " - Create Root Certificate -"
echo

openssl req -config config/openssl.cnf \
      -key root/private/ca.key.pem \
      -new -x509 -days 9135 -sha256 -extensions v3_ca \
      -out root/certs/ca.cert.pem

openssl x509 -noout -text -in root/certs/ca.cert.pem



