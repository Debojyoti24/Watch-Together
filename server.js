// A simple WebSocket server using the 'ws' library.
// To run this, you need to have Node.js and the 'ws' package installed.
// To install the package, run `npm install ws` in your terminal.
// Then, you can run the server with `node server.js`.

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

console.log("WebSocket server is running on port 8080.");

wss.on("connection", (ws) => {
  console.log("A new client has connected.");

  // Listen for messages from the client.
  ws.on("message", (message) => {
    console.log(`Received message from client: ${message}`);

    // Broadcast the message to all connected clients.
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(`Someone else said: ${message}`);
      }
    });

    // Send a response back to the original sender.
    ws.send("Message received and broadcasted!");
  });

  // Listen for the client to close the connection.
  ws.on("close", () => {
    console.log("A client has disconnected.");
  });
});
