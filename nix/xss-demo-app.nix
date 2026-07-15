{
  lib,
  pkgs,
  buildNpmPackage,
}:

let
   fs = lib.fileset;

in
  buildNpmPackage {
    pname = "xss-demo-app";
    version = "0.0.0";

    nodejs = pkgs.nodejs_24;

    src = fs.toSource {
      root = ../.;
      fileset = fs.difference
        (
          fs.gitTracked ../.
        )
        (
          fs.unions [
            ../Dockerfile
            ../docker
            ../tls
          ]
        );
    };

    npmDepsHash = "sha256-IXMRJhT5TTTtkYdEHnYKPNIk2/JD2OQkvpOdubSbFww=";

    npmFlags = [ "--ignore-scripts" ];

    installPhase = ''
      cp -r './dist/xss-demo-app/browser' "$out"
    '';
  }
