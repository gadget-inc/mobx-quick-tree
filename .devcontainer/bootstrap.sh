#!/usr/bin/env bash

# source the nix environment
source /home/vscode/.nix-profile/etc/profile.d/nix.sh

set -euox pipefail

# fixes nix builds within github codespaces, see https://github.com/xtruder/nix-devcontainer/issues/12
sudo setfacl --remove-default  /tmp

sudo locale-gen en_US.UTF-8

# Pre-load development environment
direnv allow
nix print-dev-env > /dev/null
