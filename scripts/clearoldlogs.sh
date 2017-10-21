#!/bin/bash

find ../logs/*.log -mtime +10 -type f -delete
