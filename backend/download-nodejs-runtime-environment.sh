#!/usr/bin/env bash

# Explanation of this script:
# The script downloads the appropriate Node.js binary (arm64 or x64) based on the system architecture.
# It extracts the downloaded archive into a directory named with the current date.
# It sets up environment variables to use the newly downloaded Node.js binaries.
# It generates a start-webapp-localnode.sh script that will use the downloaded Node.js environment to run server.js.
# The generated start-webapp-localnode.sh script should correctly set up the environment variables to use the downloaded Node.js runtime.

# mkdir a directory for the binaries with todays date in a variable
target_dir="node-v22.11.0-$(date +%Y-%m-%d)"
echo "Re-creating a fresh copy of node binaries in the local folder: $target_dir"
rm -rf "$target_dir"
mkdir -p "$target_dir"
cd "$target_dir"

# if arm, or x64 download the correct binary
echo "Extracting node binaries..."
if [ "$(uname -m)" == "aarch64" ]; then
    curl -L https://nodejs.org/dist/v22.11.0/node-v22.11.0-linux-arm64.tar.xz -o node-v22.11.0-linux-arm64.tar.xz
    tar xfJ node-v22.11.0-linux-arm64.tar.xz -C .
    cd node-v22.11.0-linux-arm64
else
    curl -L https://nodejs.org/dist/v22.11.0/node-v22.11.0-linux-x64.tar.gz -o node-v22.11.0-linux-x64.tar.gz
    tar xf node-v22.11.0-linux-x64.tar.gz -C .
    cd node-v22.11.0-linux-x64
fi

# cd node*
cd bin

export NODE_HOME="$(pwd)/.."
export NPM_CONFIG_PREFIX="$(pwd)/../.npm-global"
export NODE_PATH="$NODE_HOME/lib/node_modules"
export PATH="$NODE_HOME/bin:$PATH"

node_binary=$(pwd)/node
npm_binary=$(pwd)/npm

# install the node_modules
cd ../../../
$npm_binary install --save
cd -

# Generate start-webapp-localnode.sh
cat > ../../../start-webapp-localnode.sh << EOL
#!/usr/bin/env bash

# Get the directory where the script is located
SCRIPT_DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"

# Set up Node.js environment variables
export NODE_HOME="\$SCRIPT_DIR/node-v22.11.0-$(date +%Y-%m-%d)/node-v22.11.0-linux-\$(uname -m | grep -q "aarch64" && echo "arm64" || echo "x64")"
export NPM_CONFIG_PREFIX="\$NODE_HOME/.npm-global"
export NODE_PATH="\$NODE_HOME/lib/node_modules"
export PATH="\$NODE_HOME/bin:\$PATH"

# Start the web application
cd "\$SCRIPT_DIR"
node server.js
EOL

# Make the generated script executable
chmod +x ../../../start-webapp-localnode.sh

echo "Generated start-webapp-localnode.sh successfully!"

# cd ..
# $npm_binary install --save
# $npm_binary start
# $npm_binary run
# $npm_binary run --prefix=..
