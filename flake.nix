{
  description = "Generates flags using stripes from existing pride flags";

  inputs = { nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable"; };

  outputs = { self, nixpkgs }:
    let
      # User-friendly version number
      version = builtins.substring 0 8 self.lastModifiedDate;

      # System types to support
      supportedSystems =
        [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];

      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;

      nixpkgsFor = forAllSystems (system: import nixpkgs { inherit system; });
    in {
      packages = forAllSystems (system:
        let
          derivation = nixpkgsFor.${system}.buildGoModule {
            pname = "signal-flags";
            inherit version;
            src = ./.;
            vendorSha256 =
              "sha256-pQpattmS9VmO3ZIQUFn66az8GSmB4IvYhTTCFn6SUmo=";
          };

        in {
          signal-flags = derivation;
          default = derivation;
        });

      apps = forAllSystems (system: {
        default = {
          type = "app";
          program = "${self.packages.${system}.signal-flags}/bin/signal-flags";
        };
      });

      devShells = forAllSystems (system: {
        default = let pkgs = nixpkgsFor.${system};
        in pkgs.mkShell {

          buildInputs = with pkgs; [
            go

            # autoformatters
            nodePackages.prettier
          ];
        };
      });
    } // {
      nixosModules.default = { config, lib, pkgs, ... }:
        let cfg = config.dogbuilt.services.signal-flags;
        in {
          options.dogbuilt.services.signal-flags = {
            enable = lib.mkEnableOption "Enables the signal-flag HTTP service";

            port = lib.mkOption rec {
              type = lib.types.port;
              example = 3000;
              description = lib.mdDoc "The port on which to listen.";
            };
          };

          config = lib.mkIf cfg.enable {
            systemd.services."dogbuilt.signal-flags" = {
              wantedBy = [ "multi-user.target" ];
              serviceConfig = let pkg = self.packages.${pkgs.system}.default;
              in {
                Restart = "on-failure";
                ExecStart = "${pkg}/bin/signal-flags ${toString cfg.port}";
                DynamicUser = "yes";
              };
            };
          };
        };
    };
}
