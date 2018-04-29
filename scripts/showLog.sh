#!/bin/bash

ls -t *.log | head -$1 | tail -1 | xargs less

