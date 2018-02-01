#!/bin/bash

cd ..

mkdir -p root/certs root/crl root/newcerts root/private

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



