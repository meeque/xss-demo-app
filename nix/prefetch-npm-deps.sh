#!/usr/bin/env bash
set -e -o pipefail



echo 'XSS Demo App: Running Nix helper script...'

xss_demo_nix_dir="$( realpath "$(dirname "$0")" )"
cd "${xss_demo_nix_dir}"



npm_deps_hash_file='npm-deps-hash.nix'
package_lock_file='../package-lock.json'

if command -v prefetch-npm-deps &> /dev/null
then
  echo "XSS Demo App: Updating file \`${npm_deps_hash_file}\` with npmDepsHash..."

  npm_deps_hash="$(prefetch-npm-deps "${package_lock_file}")"
  echo "\"${npm_deps_hash}\"" > "${npm_deps_hash_file}"

  echo "XSS Demo App: Updated file \`${npm_deps_hash_file}\` with npmDepsHash: \`${npm_deps_hash}\`."
else
  echo "XSS Demo App: Command \`prefetch-npm-deps\` not found on \`PATH\`."
  echo "XSS Demo App: Skipping update of file \`${npm_deps_hash_file}\` with npmDepsHash."
fi



echo 'XSS Demo App: Nix helper script done.'
