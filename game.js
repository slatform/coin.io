const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ws = new WebSocket('ws://localhost:8080'); // Connect to the server
let players = {}; // Store players from the server
let myId = null; // Your player’s ID

ws.onopen = () => {
    console.log('Connected to server!');
};

ws.onmessage = (event) => {
    players = JSON.parse(event.data); // Get the latest player data
    if (!myId) myId = Object.keys(players)[0]; // Set your ID on first update
    draw(); // Redraw the game
};

canvas.addEventListener('mousemove', (e) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ x: e.clientX, y: e.clientY })); // Send your position
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the screen
    for (let id in players) {
        const player = players[id];
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.mass, 0, Math.PI * 2); // Draw a circle
        ctx.fillStyle = '#F7931A'; // Orange for BTC
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.ticker, player.x, player.y); // Show ticker
    }
}

function startGame() {
    const ticker = document.getElementById('ticker-input').value.toUpperCase() || 'BTC';
    // We’ll add ticker sending later
}