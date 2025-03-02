const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ws = new WebSocket('ws://localhost:8080');
let gameState = { players: {}, goldCoins: [] };
let myId = null;
let viewX = 0;
let viewY = 0;
let gameStarted = false;

ws.onopen = () => {
    console.log('Connected to server!');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'update') {
        gameState = data.state;
        if (!myId && Object.keys(gameState.players).length > 0) {
            myId = Object.keys(gameState.players)[0];
            console.log(`Assigned player ID: ${myId}`);
        }
        if (gameStarted) draw();
    } else if (data.type === 'respawn' && data.id === myId) {
        console.log('You were eaten! Respawning...');
        ws.close();
        ws = new WebSocket('ws://localhost:8080');
        startGame();
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('Disconnected from server');
    gameStarted = false;
};

canvas.addEventListener('mousemove', (e) => {
    if (myId && ws.readyState === WebSocket.OPEN && gameStarted) {
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
        gameStarted = true;
        console.log(`Game started with ticker: ${ticker}`);
        document.getElementById('ui').style.display = 'none'; // Hide UI after start
    } else {
        console.error('WebSocket not connected yet. Wait a moment and try again.');
    }
}

// Start game with Enter key
document.getElementById('ticker-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startGame();
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});