// you will need: npm install node-ssh


const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const host = 'asdgasdgasdg'; // Replace with your host
const username = 'sadgasdgasd'; // Replace with your username
const password = 'asdgsadgsadg'; // Replace with your password
const command = 'show mac-a'; // Command to execute

ssh.connect({
    host: host,
    username: username,
    password: password
}).then(() => {
    console.log('Connected to the server');
    return ssh.execCommand(command);
}).then((result) => {
    console.log('STDOUT:', result.stdout);
    console.log('STDERR:', result.stderr);
}).catch((error) => {
    console.error('Error:', error);
}).finally(() => {
    ssh.dispose();
});