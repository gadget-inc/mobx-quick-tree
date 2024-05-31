{
  description = "mobx-quick-tree development environment";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, flake-utils, nixpkgs }:
    (flake-utils.lib.eachSystem [
      "x86_64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ]
      (system: nixpkgs.lib.fix (flake:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        rec {

          packages =
            rec {
              bash = pkgs.bash;
              nodejs = pkgs.nodejs_21;
              pnpm = pkgs.nodejs_21.pkgs.pnpm;
              npm = pkgs.nodejs_21.pkgs.npm;
            };

          devShell = pkgs.mkShell {
            packages = builtins.attrValues packages;
          };
        }
      )));
}
