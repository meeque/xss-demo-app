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

    npmDepsHash =
      if ( builtins.pathExists ./npm-deps-hash.nix )
      then (
        import ./npm-deps-hash.nix
      )
      else (
        builtins.throw ''
          File `nix/npm-deps-hash.nix` is missing!
          This file must be present and contain a hash based on the contents of `package-lock.json`.
          You can fix this error in several ways:

          - If you have `prefetch-npm-deps` on the `PATH`:
            Generate the file by running `npm install` **or** `nix/prefetch-npm-deps.sh`.
            (Hint: You can put `prefetch-npm-deps` on the `PATH` by running: `nix-env --install prefetch-npm-deps`.)

          - Otherwise:
            Create file `nix/npm-deps-hash.nix` that contains only an empty Nix string (`""`).
            Next run `nix-build`, which will eventually throw an error and print the expected hash.
            Finally, edit `nix/npm-deps-hash.nix`, so it contains a Nix string that holds the expected hash.

        ''
      );

    npmFlags = [ "--ignore-scripts" ];

    installPhase = ''
      cp -r './dist/xss-demo-app/browser' "$out"
    '';
  }
