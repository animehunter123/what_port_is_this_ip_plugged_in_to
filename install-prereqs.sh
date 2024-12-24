#!/bin/bash

echo "Installing prereqs, npm"
apt update
apt install -y npm

cd backend
# npm i express cors node-pty #This is manual way, but i put everything in packages.json so...
npm i
cd ..

cd frontend
npm i
cd ..

echo "Prereqs installed on your host (later, we can dockerize it)."