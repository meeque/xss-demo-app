{
  lib,
  dockerTools,
  runCommand,
  writeTextFile,

  nginx,
  busybox,
  xssDemoApp,
}:

let

  fs = lib.fileset;

  containerConfigFiles =
    fs.toSource {
      root = ./docker;
      fileset = ./docker/etc;
    };

  nginxConfigFiles =
    fs.toSource {
      root = ../docker;
      fileset = ../docker/etc/nginx;
    };

  webRootFiles =
    runCommand
      "web-root-files"
      {}
      ''
        mkdir -p $out/usr/share/nginx/html
        cp -r ${xssDemoApp}/. $out/usr/share/nginx/html/
      '';

  xssDemoAppWrapperScript =
    writeTextFile {
      executable = true;
      name = "100-xss-demo-app.sh";
      destination = "/docker-entrypoint.d/100-xss-demo-app.sh";
      text = builtins.readFile ../docker/docker-entrypoint.d/100-xss-demo-app.sh;
    };

  entrypointScript =
    writeTextFile {
      executable = true;
      name = "docker-entrypoint.sh";
      destination = "/docker-entrypoint.sh";
      text = builtins.readFile ./docker/docker-entrypoint.sh;
    };

in

  dockerTools.buildImage {
    name = "meeque/xss-demo-app";
    tag = "nix-latest";

    copyToRoot = [
      nginx
      busybox

      containerConfigFiles
      nginxConfigFiles
      webRootFiles
      xssDemoAppWrapperScript
      entrypointScript
    ];

    extraCommands = ''
      # Make the xss-demo-app dir world-writable so the entrypoint
      # can create the http/https symlink.
      chmod 777 etc/nginx/xss-demo-app

      # make runtime dirs (cache, logs) world-writable
      mkdir -p var/run var/cache/nginx var/log/nginx var/empty tmp
      touch var/run/nginx.pid
      chmod 777 var/run var/cache/nginx var/log/nginx
      chmod 1777 tmp
      chmod 666 var/run/nginx.pid
    '';

    config = {
      User = "101:101";
      Entrypoint = [ "/docker-entrypoint.sh" ];
      ExposedPorts = {
        "8080/tcp" = {};
        "8443/tcp" = {};
      };
    };
  }
