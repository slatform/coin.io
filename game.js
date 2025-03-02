const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ws = new WebSocket('ws://localhost:8080');
let gameState = { players: {}, goldCoins: [] };
let myId = null;

// Center the view on the player
let viewX = 0;
let viewY = 0;

ws.onopen = () => {
    console.log('Connected to server!');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'update') {
        gameState = data.state;
        if (!myId && Object.keys(gameState.players).length > 0) {
            myId = Object.keys(gameState.players)[0]; // Assign ID on first update
        }
        draw();
    } else if (data.type === 'respawn' && data.id === myId) {
        ws.close();
        ws = new WebSocket('ws://localhost:8080');
        startGame();
    }
};

canvas.addEventListener('mousemove', (e) => {
    if (myId && ws.readyState === WebSocket.OPEN) {
        const player = gameState.players[myId];
        if (player) {
            const targetX = e.clientX + viewX;
            const targetY = e.clientY + viewY;
            ws.send(JSON.stringify({ type: 'move', x: targetX, y: targetY }));
        }
    }
});

function startGame() {
    const ticker = document.getElementById('ticker-input').value.toUpperCase() || 'BTC';
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'init', ticker }));
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Center view on player
    if (myId && gameState.players[myId]) {
        const player = gameState.players[myId];
        viewX = player.x - canvas.width / 2;
        viewY = player.y - canvas.height / 2;
    }

    // Draw gold coins
    gameState.goldCoins.forEach(coin => {
        ctx.beginPath();
        ctx.arc(coin.x - viewX, coin.y - viewY, coin.mass, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
    });

    // Draw players
    for (let id in gameState.players) {
        const player = gameState.players[id];
        ctx.beginPath();
        ctx.arc(player.x - viewX, player.y - viewY, player.mass, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${Math.max(10, player.mass / 2)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(player.ticker, player.x - viewX, player.y - viewY + player.mass / 4);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});