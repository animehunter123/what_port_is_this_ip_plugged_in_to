
// You will need: npm i telnet-client@0.16.4

const Telnet = require('telnet-client');

async function runTelnet() {
    // Define your variables
    const host = 'asdgasgasdgasdgasdg.asdgasdg.local'; // Replace with your host
    const username = 'sdgasdgas'; // Replace with your username (if needed)
    const password = 'asdgasdg'; // Replace with your password (if needed)
    const command = 'show mac-a'; // Command to execute

    const connection = new Telnet(); // Ensure this is correct
    const params = {
        host: host,
        port: 23,                  // Default Telnet port
        shellPrompt: '/ # ',       // Adjust based on the prompt you expect
        timeout: 1500,
    };

    try {
        // Connect to the server
        await connection.connect(params);
        console.log('Connected to the Telnet server');

        // Send a command
        const response = await connection.exec(command);
        console.log('Response:', response);

        // Close the connection
        await connection.end();
        console.log('Connection closed');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the Telnet command
runTelnet();