{
  lib,
  dockerTools,
  runCommand,
  writeShellScript,

  nginx,
  bash,
  coreutils,
  xssDemoApp,
}:

let

  containerConfigFiles =
    lib.fileset.toSource {
      root = ./docker;
      fileset = ./docker/etc;
    };

  nginxConfigFiles =
    lib.fileset.toSource {
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
    writeShellScript
      "100-xss-demo-app.sh"
      (
        builtins.readFile ../docker/docker-entrypoint.d/100-xss-demo-app.sh
      );

  entrypointScript =
    writeShellScript
      "docker-entrypoint.sh"
      ''
        ${xssDemoAppWrapperScript}

        exec nginx -c /etc/nginx/nginx.conf
      '';

in

  dockerTools.buildImage {
    name = "meeque/xss-demo-app";
    tag = "nix-latest";

    copyToRoot = [
      nginx
      bash
      coreutils

      containerConfigFiles
      nginxConfigFiles
      webRootFiles
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
      Entrypoint = [ "${entrypointScript}" ];
      ExposedPorts = {
        "8080/tcp" = {};
        "8443/tcp" = {};
      };
      User = "101:101";
    };
  }
