let
  nixpkgs = fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-25.11";
  pkgs = import nixpkgs { config = {}; overlays = []; };
in
{
  xssDemoApp = pkgs.callPackage ./nix/xss-demo-app.nix {};
}
