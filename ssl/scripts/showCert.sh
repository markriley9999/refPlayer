#!/bin/bash

cd ..

echo "*********************** CSR ***********************"
openssl req -noout -text -in server/csr/refPlayer.csr.pem

echo "*********************** Cert ***********************"    
openssl x509 -noout -text -in server/certs/refPlayer.cert.pem
