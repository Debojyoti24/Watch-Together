// This is a simple WebSocket-based signaling server for WebRTC.
// It's a key component for helping two peers find and connect to each other.
// To run this server:
// 1. Make sure you have Node.js installed.
// 2. Open a terminal in this folder and run: `npm install ws`
// 3. Then, run the server with: `node server.js`

// Import the WebSocket library.
const WebSocket = require("ws");

// Set up the WebSocket server on port 8080.
const wss = new WebSocket.Server({ port: 8080 });

// This object will hold the active rooms, with each room containing its connected peers.
const rooms = {};

// Handle new connections to the server.
wss.on("connection", (ws) => {
  console.log("Client connected.");

  // Listen for messages from the clients.
  ws.on("message", (message) => {
    // Parse the incoming JSON message.
    const data = JSON.parse(message);
    const { type, room, payload } = data;

    console.log(`Received message of type: ${type} for room: ${room}`);

    switch (type) {
      case "join":
        // A client wants to join a specific room.
        if (!rooms[room]) {
          rooms[room] = [];
        }
        // Add the new client to the room's list of peers.
        rooms[room].push(ws);
        console.log(
          `Client joined room: ${room}. Total clients: ${rooms[room].length}`
        );

        // If there are two clients in the room, send a 'ready' message to both.
        // This tells them they can now start the WebRTC handshake.
        if (rooms[room].length === 2) {
          rooms[room].forEach((peer) => {
            peer.send(JSON.stringify({ type: "ready" }));
          });
          console.log(
            `Two clients ready in room: ${room}. Starting peer connection.`
          );
        }
        break;

      case "offer":
      case "answer":
      case "ice-candidate":
        // These are the crucial WebRTC signaling messages.
        // Find the other client in the same room and relay the message to them.
        const otherPeer = rooms[room].find((peer) => peer !== ws);
        if (otherPeer) {
          otherPeer.send(JSON.stringify({ type, payload }));
          console.log(`Relaying ${type} message to peer in room: ${room}`);
        }
        break;

      default:
        console.log(`Unknown message type: ${type}`);
    }
  });

  // Handle client disconnections.
  ws.on("close", () => {
    console.log("Client disconnected.");
    // Remove the disconnected client from their room.
    for (const room in rooms) {
      const index = rooms[room].indexOf(ws);
      if (index > -1) {
        rooms[room].splice(index, 1);
        console.log(
          `Client left room: ${room}. Remaining clients: ${rooms[room].length}`
        );
        // If the room is now empty, you could remove it.
        if (rooms[room].length === 0) {
          delete rooms[room];
        }
      }
    }
  });
});

console.log("WebRTC signaling server running on ws://localhost:8080");
