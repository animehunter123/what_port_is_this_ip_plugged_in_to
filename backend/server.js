const express = require('express');
const cors = require('cors');
const { Client } = require('ssh2');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.post('/ssh', (req, res) => {
    const { username, password, command, host } = req.body;
    const conn = new Client();

    conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
            if (err) {
                return res.json({
                    stdout: '',
                    stderr: err.message,
                    rc: 1,
                    error_msg: 'Execution error',
                    details: null
                });
            }
            let stdout = '', stderr = '';
            stream.on('close', (code, signal) => {
                conn.end();
                res.json({
                    stdout,
                    stderr,
                    rc: code,
                    error_msg: null,
                    details: null
                });
            }).on('data', (data) => {
                stdout += data;
            }).stderr.on('data', (data) => {
                stderr += data;
            });
        });
    }).on('error', (err) => {
        res.json({
            stdout: '',
            stderr: err.message,
            rc: 1,
            error_msg: 'SSH connection error',
            details: null
        });
    }).connect({
        host: host, 
        port: 22,
        username: username,
        password: password
    });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
