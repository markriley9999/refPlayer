#!/bin/bash

MAJOR=$(grep -Po 'major\"[\s]*:[\s]*\"(\K[\d]+)' ../version.json)
MINOR=$(grep -Po 'minor\"[\s]*:[\s]*\"(\K[\d]+)' ../version.json)

VERSION="$MAJOR.$MINOR"

echo $VERSION

