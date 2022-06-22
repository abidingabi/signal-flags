{
  description = "Generates flags using stripes from existing pride flags";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        defaultApp = with pkgs;
          writeShellApplication {
            name = "signal-flags";

            runtimeInputs = [ imagemagick nodejs ];

            text = "node serve.js";
          };

        devShell = with pkgs;
          mkShell {
            buildInputs = [
              imagemagick
              nodejs

              # autoformatters
              nodePackages.prettier
            ];
          };
      });
}
