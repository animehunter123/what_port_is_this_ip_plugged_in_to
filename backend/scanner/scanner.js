// Remember to use:  npm install --save network-scanner-js
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const { networkInterfaces } = require('os');

// Function to get the subnet from an IP address
function getSubnet(ip) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`; // Assuming a /24 subnet
}

// Function to check if an IP address is in a valid LAN range
function isValidLAN(ip) {
    const parts = ip.split('.');
    const firstOctet = parseInt(parts[0]);
    const secondOctet = parseInt(parts[1]);

    // Check for Class A, B, and C private ranges
    return (firstOctet === 10) || // Class A
           (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) || // Class B
           (firstOctet === 192 && secondOctet === 168); // Class C
}

// Function to scan the subnet for hosts
function scanSubnet(subnet, interfaceName) {
    return new Promise((resolve, reject) => {
        console.log(`OK ABOUT TO RUN: nmap -sn ${subnet} -e ${interfaceName}`);
        exec(`nmap -sn ${subnet} -e ${interfaceName}`, (error, stdout) => {
            if (error) {
                return reject(error);
            }
            const results = parseNmapOutput(stdout);
            resolve(results);
        });
    });
}

// Function to parse nmap output and extract relevant information
function parseNmapOutput(output) {
    const results = [];
    const lines = output.split('\n');
    let currentIp = '';

    lines.forEach(line => {
        const ipMatch = line.match(/Nmap scan report for (.+)/);
        const hostUpMatch = line.match(/Host is up/);
        const macMatch = line.match(/MAC Address: (.+?) \((.+?)\)/);
        
        if (ipMatch) {
            currentIp = ipMatch[1].trim();
        } else if (hostUpMatch && currentIp) {
            // If the host is up but no MAC address is found, still add the IP
            results.push({ ip: currentIp, mac: 'Unknown', hostname: 'Unknown' });
        } else if (macMatch) {
            const mac = macMatch[1].trim();
            const hostname = currentIp ? currentIp : 'Unknown';
            results.push({ ip: currentIp, mac, hostname });
            currentIp = ''; // Reset for the next entry
        }
    });

    return results;
}


// Main function to scan all interfaces
async function main() {
    const interfaces = networkInterfaces();
    const results = [];

    for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        const ipInfo = iface.find(details => details.family === 'IPv4' && !details.internal);

        if (ipInfo) {
            const subnet = getSubnet(ipInfo.address);
            if (isValidLAN(ipInfo.address)) { // Check if the IP is in a valid LAN range
                console.log(`Scanning subnet ${subnet} on interface ${interfaceName}...`);
                const scanResults = await scanSubnet(subnet, interfaceName);
                results.push(...scanResults);
            } else {
                console.log(`Skipping non-LAN IP: ${ipInfo.address}`);
            }
        }
    }

    // Write results to JSON file
    fs.writeFileSync('network_scan_results.json', JSON.stringify(results, null, 2));
    console.log('Scan results saved to network_scan_results.json');
}

// Run the main function
main().catch(err => console.error(err));