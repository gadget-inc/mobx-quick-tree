# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.202.1/containers/debian/.devcontainer/base.Dockerfile

# [Choice] Debian version (use bullseye or stretch on local arm64/Apple Silicon): bullseye, buster, stretch
ARG VARIANT="buster"
FROM mcr.microsoft.com/vscode/devcontainers/base:0-${VARIANT}

# use bash to run commands in the dockerfile so we can easily source the nix environment
SHELL ["/bin/bash", "-c"]

# install dependencies nix needs to install itself
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install --no-install-recommends xz-utils acl

# set up chsh to allow passwordless shell changing
RUN sed -i 's/required/sufficient/' /etc/pam.d/chsh

# setup the default vscode user that codespaces uses as a passwordless sudoer
RUN usermod -aG sudo vscode && echo "vscode   ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers
USER vscode
ENV USER=vscode

# Install nix (requires non-root user)
RUN curl -L https://nixos.org/nix/install | sh -s -- --no-daemon && \
  echo 'source ~/.nix-profile/etc/profile.d/nix.sh' >> ~/.bashrc

# Enable required Nix experimental features & pin the nixpkgs flake
ENV NIXPKGS_COMMIT=ec750fd01963ab6b20ee1f0cb488754e8036d89d
RUN source ~/.nix-profile/etc/profile.d/nix.sh && \
  nix-env -f https://github.com/NixOS/nixpkgs/archive/$NIXPKGS_COMMIT.tar.gz -iA nix && \
  mkdir -p ~/.config/nix && \
  echo 'experimental-features = nix-command flakes' >> ~/.config/nix/nix.conf && \
  nix registry pin nixpkgs github:NixOS/nixpkgs/$NIXPKGS_COMMIT

# Install & setup direnv
RUN source ~/.nix-profile/etc/profile.d/nix.sh && \
  nix profile install nixpkgs#direnv nixpkgs#nix-direnv && \
  echo 'eval "$(direnv hook bash)"' >> ~/.bashrc && \
  echo 'source ~/.nix-profile/share/nix-direnv/direnvrc' >> ~/.direnvrc

# Install docker and setup buildx as default docker builder
RUN source ~/.nix-profile/etc/profile.d/nix.sh && \
  nix profile install nixpkgs#docker && \
  docker buildx install
