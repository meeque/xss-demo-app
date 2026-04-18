let
  pkgs =
    import
      ( fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-25.11" )
      {
        config = {};
        overlays = [];
      };
  xssDemoApp =
    pkgs.callPackage
      ./nix/xss-demo-app.nix
      {};

in
  {
    inherit xssDemoApp;

    xssDemoAppDockerImage =
      pkgs.callPackage
        ./nix/xss-demo-app-docker-image.nix
        { inherit xssDemoApp; };
  }
