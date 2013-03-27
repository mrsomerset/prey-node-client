#!/bin/bash

#####################################################################
# TEST LIBRARY
#
# Prey Client
#
# Script to install testing environment for
# sudo su {USERNAME} -c "[./bin/prey] config activate"
#
#####################################################################

SRCPATH="$1"
DSTPATH="$2"
USERNAME="$3"

mkdir "${DSTPATH}/node_modules"
cp -r "${SRCPATH}/node_modules/async" "${DSTPATH}/node_modules/."
cp -r "${SRCPATH}/node_modules/commander" "${DSTPATH}/node_modules/."
cp -r "${SRCPATH}/node_modules/dialog" "${DSTPATH}/node_modules/."
cp -r "${SRCPATH}/node_modules/getset" "${DSTPATH}/node_modules/."
cp -r "${SRCPATH}/node_modules/needle" "${DSTPATH}/node_modules/."
cp -r "${SRCPATH}/node_modules/reply" "${DSTPATH}/node_modules/."
cp -r "${SRCPATH}/node_modules/sandboxed-module" "${DSTPATH}/node_modules/."

mkdir "${DSTPATH}/lib"
cp -r "${SRCPATH}/lib/." "${DSTPATH}/lib/."

cp "${SRCPATH}/prey.conf.default" "${DSTPATH}/."
cp "${SRCPATH}/package.json" "${DSTPATH}/."

cp "${SRCPATH}/test/lib/config_activate_tester_nix.js" "${DSTPATH}/."

chown -R "${USERNAME}": "${DSTPATH}"
