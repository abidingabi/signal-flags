{
  description = "Generates flags using stripes from existing pride flags";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        version = builtins.substring 0 8 self.lastModifiedDate;
      in {
        packages = {
          default = pkgs.buildGoModule {
            pname = "signal-flags";
            inherit version;
            src = ./.;
            vendorSha256 =
              "sha256-pQpattmS9VmO3ZIQUFn66az8GSmB4IvYhTTCFn6SUmo=";
          };
        };

        apps.default =
          utils.lib.mkApp { drv = self.packages.${system}.default; };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            go

            # autoformatters
            nodePackages.prettier
          ];
        };
      });
}
