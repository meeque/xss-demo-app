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

  nginxUid = "101";
  nginxGid = "101";
  nginxUidGid = "${nginxUid}:${nginxGid}";

  customFakeNss =
    dockerTools.fakeNss.override {
      extraPasswdLines = [
        "nginx:x:${nginxUidGid}:nginx user:/var/empty:/bin/false"
      ];
      extraGroupLines = [
        "nginx:x:${nginxGid}:"
      ];
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
      text = builtins.readFile ./docker-entrypoint.sh;
    };

in

  dockerTools.buildLayeredImage {
    name = "meeque/xss-demo-app";
    tag = "nix-latest";

    contents = [
      # dependencies
      nginx
      busybox

      # custom files
      customFakeNss
      nginxConfigFiles
      xssDemoAppWrapperScript
      entrypointScript
      webRootFiles
    ];

    fakeRootCommands = ''
      # adjust nginx config dir permissions
      chown  -R  '${nginxUidGid}'  etc/nginx
      chmod  -R  'go-rwx'  etc/nginx/xss-demo-app/tls

      # adjust nginx runtime dirs permissions
      mkdir  -p  var/run  var/cache/nginx  var/log/nginx  tmp
      touch  var/run/nginx.pid
      chown  -R  '${nginxUidGid}'  var/run/nginx.pid  var/cache/nginx  var/log/nginx
      chmod  '1777'  tmp
    '';

    config = {
      User = "${nginxUidGid}";
      WorkingDir = "/tmp/";
      Entrypoint = [
        "/docker-entrypoint.sh"
      ];
      Command = [];
      Volumes = {
        "/etc/nginx/xss-demo-app/tls/" = {};
      };
      ExposedPorts = {
        "8080/tcp" = {};
        "8443/tcp" = {};
      };
    };
  }
