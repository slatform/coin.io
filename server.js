const WebSocket = require('ws'); // Load the WebSocket library

const wss = new WebSocket.Server({ port: 8080 }); // Start server on port 8080

let players = {}; // Store all players’ info

wss.on('connection', (ws) => {
    console.log('New player connected!');
    const id = Date.now(); // Unique ID for each player
    players[id] = { x: 500, y: 500, mass: 10, ticker: 'BTC' }; // Default starting point

    ws.on('message', (message) => {
        const data = JSON.parse(message); // Parse the message from the client
        players[id].x = data.x; // Update player’s X position
        players[id].y = data.y; // Update player’s Y position
    });

    ws.on('close', () => {
        console.log('Player disconnected!');
        delete players[id]; // Remove player when they leave
    });

    // Send updates to all players 60 times per second
    setInterval(() => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(players)); // Send all player data
            }
        });
    }, 1000 / 60);
});

console.log('Server running on ws://localhost:8080');