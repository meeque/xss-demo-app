{
  lib,
  buildNpmPackage,
}:

let
   fs = lib.fileset;

in
  buildNpmPackage {
    pname = "xss-demo-app";
    version = "0.0.0";

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

    npmDepsHash = "sha256-x6VH4V8JNUhSSA7d1TfiZ1s04OkMOL2JikI8OsTBVhk=";

    npmFlags = [ "--ignore-scripts" ];

    installPhase = ''
      cp -r './dist/xss-demo-app/browser' "$out"
    '';
  }
