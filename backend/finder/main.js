// #TODO Need to change this to a endpoint which accepts a $final_target of HOST/MAC/IP

// PHASE 0: When this endpoint recieves a target device to search for; first PING and if it response continue, else FAIL at this point
// $final_target="wekan.lm.local"  /* NOTE THIS CAN BE HOSTNAME, MAC, OR IP */
$final_target="192.168.0.105"  /* NOTE THIS CAN BE HOSTNAME, MAC, OR IP */

const exec = require('child_process').exec;
exec(`ping -c 1 ${$final_target}`, (error, stdout, stderr) => {
    if (error) {
        console.error(`[ERROR] ${$final_target} is not reachable`);
        process.exit(1);
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
    const target = $final_target;
    const foundDevice = newDevices.find(device => 
        device.dev_mac.toLowerCase() === target.toLowerCase() || 
        device.dev_ip.toLowerCase() === target.toLowerCase() || 
        device.dev_hostname.toLowerCase() === target.toLowerCase()
    );
    
    if (foundDevice) {
        console.log(`Final target ${target} found:`);
        console.log(foundDevice);
        // process.exit(0);
    } else {
        console.log(`Final target ${target} NOT found in newDevices.`);
    }
} else {
    console.log('No final target specified.');
}

    });
});