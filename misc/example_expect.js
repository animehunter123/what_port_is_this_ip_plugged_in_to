// for this guy, you will need: npm install expect.js node-pty

const { spawn } = require('child_process');
const { Console } = require('console');
const expect = require('expect.js');

const host = 'asdgasdgasdgasdgasdg'; // Replace with your host
const username = 'asdgasdgasdg'; // Replace with your username
const password = 'asdgasdgasdg'; // Replace with your password
const command = 'show mac-a'; // Command to execute

const pty = require('node-pty');



let commandSent = false;

const ssh = pty.spawn('ssh', [
    '-o', 'KexAlgorithms=diffie-hellman-group14-sha1,diffie-hellman-group1-sha1',
    '-o', 'HostKeyAlgorithms=+ssh-rsa',
    '-o', 'StrictHostKeyChecking=no',
    `${username}@${host}`
], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
});

ssh.on('data', (data) => {
    console.log(`Output: ${data}`);

    if (data.includes('Password:')) {
        ssh.write(`${password}\r`);
    } else if (data.includes('SSH@LM-SW01>') && !commandSent) {
        ssh.write(`${command}\r`);
        commandSent = true;
    } else if (data.includes('--More--')) {
        ssh.write(' ');
    } else if (data.includes('SSH@LM-SW01>') && commandSent) {
        ssh.write('quit\r');
        process.exit(0);
    }
});

// Fallback exit after a certain timeout
setTimeout(() => {
    console.log('Timeout reached, exiting...');
    process.exit(0);
}, 60000); // Adjust timeout as needed
