

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
    let arpPromises = agg_switches.map(host => {
        return fetch('http://localhost:5000/ssh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host,
                username: 'admin',
                password: 'Oriole3',
                command: 'show arp'
            })
        }).then(response => response.json()).then(data => {
            // Include the host in the result for later use
            data.host = host; // Add the host to the result
            return data;
        });
    });

    Promise.all(arpPromises).finally(() => {
        // Process the ARP results
        const arpResults = arpPromises.map(p => p.then(data => data));
        Promise.all(arpResults).then(arpData => {
            arpData.forEach(result => {
                if (result.stdout) {
                    const arpLines = result.stdout.split('\n').filter(line => {
                        // Regular expression to match ARP entries
                        return /(\d+\s+\d+\.\d+\.\d+\.\d+\s+[0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4})/i.test(line);
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
            });

            // Log the updated devices array
            console.log('Updated devices with IP addresses:', newDevices);
        });
    });
});