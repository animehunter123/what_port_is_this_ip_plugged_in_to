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
        // console.log(`Output: ${data}`);

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

            // FINALLY, Clean the output before sending response
            // output = cleanSSHOutput(output);
            // Clean the output based on the command
            let cleanedOutput;
            if (command.includes('show arp')) {
                cleanedOutput = cleanOutput_ShowArp(output);
            } else if (command.includes('show mac-a')) {
                cleanedOutput = cleanOutput_ShowMacAddr(output);
            } else {
                cleanedOutput = output; // For other commands, don't clean
            }

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
    console.log(`Our Express.js server is now listening on port ${port}`);
});



function cleanOutput_ShowArp(rawOutput) {
    return rawOutput
        .replace(/\r\n?|\n/g, '\n')  // Normalize line endings
        .replace(/^.*?Total number of ARP entries:/m, 'Total number of ARP entries:')  // Remove everything before the total count
        .replace(/SSH@LM-SW01>.*/s, '')  // Remove the command prompt at the end
        .replace(/--More--.*?(\n|$)/g, '')  // Remove "--More--" prompts
        .replace(/\x1B\[[0-9;]*[JKmsu]/g, '')  // Remove ANSI escape sequences
        // .replace(/\b+/g, '')  // Remove backspace characters
        .trim();  // Trim leading and trailing whitespace
}

function cleanOutput_ShowMacAddr(rawOutput) {
    return rawOutput
        .replace(/\r\n?|\n/g, '\n')  // Normalize line endings
        .replace(/^.*?Total active entries from all ports =/m, 'Total active entries from all ports =')  // Remove everything before the total count
        .replace(/SSH@LM-SW01>.*/s, '')  // Remove the command prompt at the end
        .replace(/--More--.*?(\n|$)/g, '')  // Remove "--More--" prompts
        .replace(/\x1B\[[0-9;]*[JKmsu]/g, '')  // Remove ANSI escape sequences
        // .replace(/\b+/g, '')  // Remove backspace characters
        .replace(/MAC-Address\s+Port\s+Type\s+VLAN\s+/g, '')  // Remove repeated header
        .trim();  // Trim leading and trailing whitespace
}





function cleanSSHOutput(rawOutput) {
    return rawOutput
        .replace(/\r/g, '')           // Remove carriage returns
        .replace(/\b/g, '')           // Remove backspaces
        .replace(/\x1B\[[0-9;]*[JKmsu]/g, '') // Remove ANSI escape sequences
        .replace(/--More--.*?(\r?\n|\r)/g, '') // Remove pagination prompts and the rest of that line
        .replace(/\n{3,}/g, '\n\n')   // Replace 3 or more newlines with just 2
        .replace(/SSH@LM-SW01>/g, '') // Remove command prompts
        .trim();                      // Trim leading and trailing whitespace
}



// // Function to clean up the \r \b characters, and replace the \\n with \n (for the output of the ssh cli command)
// function cleanSSHOutput(rawOutput) {
//     // Remove unwanted characters
//     return rawOutput

//     .replace(/\r/g, '')           // Remove carriage returns
//     .replace(/\b/g, '')           // Remove backspaces
//     .replace(/\x1B\[[0-9;]*[JKmsu]/g, '') // Remove ANSI escape sequences
//     .replace(/--More--.*?\r?\n/g, '') // Remove pagination prompts and the rest of that line
//     .replace(/\n{3,}/g, '\n\n')   // Replace 3 or more newlines with just 2

//         .replace(/\\r/g, '')         // Remove a "\\r"
//         .replace(/\\b/g, '')         // Remove a "\\b"
//         .replace(/\\n/g, '\n')         // Replace a "\\n" with "\n"
//         // .replace(/--More--/g, '')  // Remove pagination prompts (#TODO IM NOT SURE IF I NEED THIS YET)
//         .trim();                   // Trim leading and trailing whitespace
// }
// // Example usage
// // const rawOutput = "1    \r\n0050.5687.d2c4  1/3/2\nDynamic      1    \r\n--More--, next page: Space, next line: Return key, quit: Control-c\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b ";
// // const cleanedOutput = cleanSSHOutput(rawOutput);
// // console.log(cleanedOutput);








































/* TO TEST THIS ENDPOINT...


> curl -X POST http://localhost:5000/find-device \
                                    -H "Content-Type: application/json" \
                                    -d '{ "final_target": "192.168.0.105" }'
{"switch":"lm-sw01.lm.local","dev_mac":"0062.0b0a.d9a8","port":"1/1/7","dev_ip":"192.168.0.105","dev_hostname":"lm-esx02"}⏎ 


*/

// const express = require('express');
// const cors = require('cors');
const { exec } = require('child_process'); // Import exec
// const app = express();
// const port = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

app.post('/find-device', (req, res) => {
    $final_target = req.body.final_target; // Get final_target from the request body

    const exec = require('child_process').exec;
    exec(`ping -c 1 ${$final_target}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`[ERROR] ${$final_target} is not reachable`);
            // process.exit(1);
            res.status(400).json({ error: `${$final_target} is not reachable` });
            return;

        } else {
            console.log(`${$final_target} is reachable`);
        }
    });
    
    // PHASE 1: SSH into each AGG Switch, and save "show mac-a" or "show mac a" to a table. Filter out to only lines which contain a '/', such as: "d08a.abcd.d419 1/1/9 Dynamic 180"
    let agg_switches = [
        "lm-sw01.lm.local"
    ];
    
    let results = [];
    let fetchPromises = agg_switches.map(host => {
        return fetch('http://localhost:5000/ssh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host,
                username: 'admin',
                password: 'Oriole3',
                command: 'show mac-a'
            })
        }).then(response => response.json())
        .then(data => {
            // Include the host in the result for later use
            data.host = host; // Add the host to the result
            results.push(data);
        });
    });
    
    Promise.all(fetchPromises).finally(() => {
        // Log the results to see what is being returned
        // console.log('Raw results:', results);
    
        // At this point, every item in "results" is a valid mac address, and port number", lets add this to device list
        const newDevices = results.reduce((acc, result) => {
            if (result.stdout) {
                const macLines = result.stdout.split('\n').filter(line => {
                    // Regular expression to match MAC address format
                    const macMatch = /([0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4})/i.test(line);
                    // Split line into fields and check the second field
                    const fields = line.split(/\s+/);
                    const hasSlashInSecondField = fields[1] && fields[1].includes('/');
                    return macMatch && hasSlashInSecondField;
                });
    
                // Log the filtered MAC lines
                // console.log('Filtered MAC Lines:', macLines);
    
                macLines.forEach(line => {
                    const fields = line.split(/\s+/);
                    const mac = fields[0];
                    const port = fields[1];
                    acc.push({
                        switch: result.host, // Use the host from the result
                        dev_mac: mac,
                        port,
                        dev_ip: '',
                        dev_hostname: ''
                    });
                });
            }
            return acc;
        }, []);
        
        // Log the new devices array
        // console.log('New devices:', newDevices);
    
        // PHASE 2: SSH into the CORE Switch, and save "show arp" to a table
        const core_switch = "lm-sw01.lm.local"; // Define core_switch variable
    
        return fetch('http://localhost:5000/ssh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host: core_switch, // Use core_switch variable
                username: 'admin',
                password: 'Oriole3',
                command: 'show arp'
            })
        }).then(response => response.json()).then(data => {
            // Include the host in the result for later use
            data.host = core_switch; // Add the host to the result
            return data;
        }).then(result => {
            if (result.stdout) {
                const arpLines = result.stdout.split('\n').filter(line => {
                    // Regular expression to match ARP entries
                    return /(\d+\s+\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\s+(?:[0-9a-f]{4}\.){2}[0-9a-f]{4})/i.test(line);
                });
    
                arpLines.forEach(line => {
                    const fields = line.split(/\s+/);
                    const ip = fields[1]; // IP Address
                    const mac = fields[2]; // MAC Address
    
                    // Update newDevices with the IP address if the MAC matches
                    newDevices.forEach(device => {
                        if (device.dev_mac === mac) {
                            device.dev_ip = ip; // Update the IP address
                        }
                    });
                });
            }
    
            // Log the updated devices array
            // console.log('Updated devices with IP addresses:', newDevices);
    
            // PHASE 3: Populate dev_hostname from DNS records
    const dnsRecords = {}; // To hold A records and CNAMEs
    const dnsFilePath = './target_dns/lm.local_2024.12.23.zone';
    
    // Read the DNS records file
    const dnsData = require('fs').readFileSync(dnsFilePath, 'utf-8').split('\n');
    
    dnsData.forEach(line => {
        // Use regex to capture relevant parts
        const dnsMatch = line.match(/^(\S+)\s+(\[AGE:\d+\])?\s+(\d+)?\s*(A|CNAME)\s+(\S+)/);
        if (dnsMatch) {
            const recordName = dnsMatch[1];
            const recordType = dnsMatch[4];
            const recordValue = dnsMatch[5];
    
            if (recordType === 'A') {
                dnsRecords[recordValue] = dnsRecords[recordValue] || { hostnames: [] };
                dnsRecords[recordValue].hostnames.push(recordName);
            } else if (recordType === 'CNAME') {
                dnsRecords[recordValue] = dnsRecords[recordValue] || { hostnames: [] };
                dnsRecords[recordValue].hostnames.push(recordName);
            }
        }
    });
    
    // Populate dev_hostname for each device
    newDevices.forEach(device => {
        if (device.dev_ip && dnsRecords[device.dev_ip]) {
            device.dev_hostname = dnsRecords[device.dev_ip].hostnames.join(' '); // Join hostnames with space
        }
    });
    
    
            // Log the final devices array with hostnames (THIS PRINTS OUT EVERYTHING)
            // console.log('Final devices with hostnames:', newDevices);
    
    // Finally, if the $final_target is in this newDevices, print it out:

    if ($final_target) {
        const target = $final_target.toLowerCase();
    
        // Function to check if a string is an IP address
        const isIPAddress = (str) => {
            const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            return ipPattern.test(str);
        };
    
        // Function to strip the domain from a hostname
        const stripDomain = (str) => str.replace(/\..*$/, '').toLowerCase();
    
        // Determine if we need to strip the domain from the target
        const processedTarget = isIPAddress(target) ? target : stripDomain(target);
    
        const foundDevice = newDevices.find(device => 
            device.dev_mac.toLowerCase() === processedTarget || 
            device.dev_ip.toLowerCase() === processedTarget || 
            device.dev_hostname.toLowerCase().includes(processedTarget)
        );
    
        if (foundDevice) {
            console.log(`Final target ${target} found:`);
            console.log(foundDevice);
            // Return success and the foundDevice object
            res.status(200).json(foundDevice);
        } else {
            console.log(`Final target ${target} NOT found in newDevices.`);
            // Return error
            res.status(404).json({ error: `Final target ${target} NOT found` });
        }
    }
        
    
    else {
        console.log('No final target specified.');
        // Return error
        res.status(400).json({ error: 'No final target specified' });
    }
    
        });
    });    


});

// Start the server
// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });