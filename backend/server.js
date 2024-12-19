const express = require('express');
const cors = require('cors');
const pty = require('node-pty');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

/* You can test this endpoint with curl:
curl -X POST http://localhost:5000/ssh \
    -H "Content-Type: application/json" \
    -d '{ "host": "fdhsdfhsdfhsdfh" ,
    "username": "sdfhsdfhsdfh",
    "password": "sdfhsdfhsdfh",
    "command": "show mac-a"
}'
*/
app.post('/ssh', (req, res) => {
    const { username, password, command, host } = req.body;
    let commandSent = false;
    let output = '';

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
        output += data;
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
            ssh.kill();
            res.json({
                stdout: output,
                stderr: '',
                rc: 0,
                error_msg: null,
                details: null
            });
        }
    });

    // Fallback timeout
    setTimeout(() => {
        if (!res.headersSent) {
            ssh.kill();
            res.json({
                stdout: output,
                stderr: 'Timeout occurred',
                rc: 1,
                error_msg: 'Command execution timed out',
                details: null
            });
        }
    }, 60000); // 60 second timeout
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
