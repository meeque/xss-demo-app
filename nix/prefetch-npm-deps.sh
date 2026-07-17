#!/usr/bin/env bash
set -e -o pipefail

echo 'XSS Demo App: Running Nix helper script...'

if ! command -v prefetch-npm-deps &> /dev/null
then
  echo 'XSS Demo App: Command "prefetch-npm-deps" not found, skipping Nix npmDepsHash update.'
  exit 0
fi

xss_demo_nix_dir="$( realpath "$(dirname "$0")" )"
cd "${xss_demo_nix_dir}"

nix_file='xss-demo-app.nix'
package_lock_file='../package-lock.json'

npm_deps_hash=$(prefetch-npm-deps "${package_lock_file}")
sed -i "s|npmDepsHash = \".*\"|npmDepsHash = \"${npm_deps_hash}\"|" "${nix_file}"

echo "XSS Demo App: Updated npmDepsHash in xss-demo-app.nix to: ${npm_deps_hash}"

echo 'XSS Demo App: Nix helper script done.'
