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

            postInstall = "cp -r static $out";
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

        nixosModules.signal-flags = { config, lib, ... }: {
          config = {
            users.groups.signal-flags = { };

            users.users.signal-flags = {
              isSystemUser = true;
              group = "signal-flags";
            };

            systemd.services.signal-flags = {
              wantedBy = [ "multi-user.target" ];
              serviceConfig = {
                User = "signal-flags";
                Group = "signal-flags";
                Restart = "always";
                WorkingDirectory = "${self.packages."${system}".default}";
                ExecStart =
                  "${self.packages."${system}".default}/bin/signal-flags";
              };
            };
          };
        };
      });
}
