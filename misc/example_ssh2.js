// to use, first> npm install ssh2

const { Client } = require('ssh2');

const conn = new Client();
const host = 'sdfgsdfg.sdfgsdfg.local'; // replace with your host
const username = 'sdfgsdfgdfgd';    // replace with your username
const password = 'adfasdfasd';         // replace with your password
const command = 'hostname; uptime'; // command to execute

conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec(command, (err, stream) => {
        if (err) throw err;
        let stdout = '', stderr = '';
        stream.on('close', (code, signal) => {
            console.log(`Stream :: close :: code: ${code}, signal: ${signal}`);
            console.log('STDOUT:', stdout);
            console.log('STDERR:', stderr);
            conn.end();
        }).on('data', (data) => {
            stdout += data;
        }).stderr.on('data', (data) => {
            stderr += data;
        });
    });
}).connect({
    host: host,
    port: 22,
    username: username,
    password: password
});