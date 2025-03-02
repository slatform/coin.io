const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Game state
let players = {};
let goldCoins = [];

// Top 200 coins (sample subset for now)
const topCoins = {
    'BTC': { color: '#F7931A', symbol: '₿' },
    'ETH': { color: '#627EEA', symbol: 'Ξ' },
    'XRP': { color: '#23292F', symbol: '✕' },
    'SOL': { color: '#00FFA3', symbol: '◎' },
    'BNB': { color: '#F3BA2F', symbol: 'B' }
};

// Spawn gold coins
function spawnGoldCoin() {
    goldCoins.push({
        id: `coin-${Date.now()}-${Math.random()}`,
        x: Math.random() * 2000, // Map size: 2000x2000
        y: Math.random() * 2000,
        mass: 5
    });
}

// Initial gold coins
for (let i = 0; i < 50; i++) spawnGoldCoin();

wss.on('connection', (ws) => {
    const id = Date.now();
    players[id] = {
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        mass: 10,
        ticker: 'BTC',
        color: topCoins['BTC'].color,
        symbol: topCoins['BTC'].symbol
    };

    // Handle messages from clients
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'init') {
            // Set ticker and appearance
            const ticker = data.ticker.toUpperCase();
            players[id].ticker = ticker;
            if (topCoins[ticker]) {
                players[id].color = topCoins[ticker].color;
                players[id].symbol = topCoins[ticker].symbol;
            } else {
                players[id].color = '#FFD700'; // Default gold
                players[id].symbol = '$';
            }
        } else if (data.type === 'move') {
            // Update position
            players[id].x = data.x;
            players[id].y = data.y;
        }
    });

    ws.on('close', () => {
        delete players[id];
    });

    // Game loop
    setInterval(() => {
        // Check player vs. gold coin collisions
        for (let playerId in players) {
            const player = players[playerId];
            goldCoins = goldCoins.filter(coin => {
                const dx = player.x - coin.x;
                const dy = player.y - coin.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < player.mass + coin.mass) {
                    player.mass += coin.mass; // Grow
                    return false; // Remove collected coin
                }
                return true;
            });

            // Check player vs. player collisions
            for (let otherId in players) {
                if (playerId === otherId) continue;
                const other = players[otherId];
                const dx = player.x - other.x;
                const dy = player.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < player.mass + other.mass && player.mass > other.mass * 1.2) {
                    player.mass += other.mass; // Absorb
                    delete players[otherId]; // Remove eaten player
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'respawn', id: otherId }));
                        }
                    });
                }
            }
        }

        // Respawn gold coins if low
        if (goldCoins.length < 30) spawnGoldCoin();

        // Send game state to all clients
        const gameState = { players, goldCoins };
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'update', state: gameState }));
            }
        });
    }, 1000 / 60); // 60 FPS
});

console.log('Server running on ws://localhost:8080');