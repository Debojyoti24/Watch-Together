const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
// Use the 'path' library to correctly resolve file paths
const path = require("path");

// Serve the static index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Create a new Socket.io server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for this example
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // Object to keep track of active rooms

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle a client's request to join a room
  socket.on("join_room", (roomId) => {
    // Check if the room exists and has space
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (rooms[roomId].length < 2) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);

      console.log(`User ${socket.id} joined room ${roomId}`);

      // If the room now has two people, let them know they can start
      if (rooms[roomId].length === 2) {
        io.to(roomId).emit("ready", roomId);
        console.log(`Room ${roomId} is ready for WebRTC connection.`);
      }
    } else {
      // Room is full, reject the connection
      socket.emit("room_full");
      console.log(`Room ${roomId} is full. User ${socket.id} could not join.`);
    }
  });

  // Handle WebRTC signaling events
  socket.on("offer", (data) => {
    // Forward the offer to the other peer in the room
    socket.to(data.roomId).emit("offer", data.sdp);
  });

  socket.on("answer", (data) => {
    // Forward the answer to the other peer in the room
    socket.to(data.roomId).emit("answer", data.sdp);
  });

  socket.on("ice_candidate", (data) => {
    // Forward the ICE candidate to the other peer in the room
    socket.to(data.roomId).emit("ice_candidate", data.candidate);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    // Find the room the user was in and remove them
    for (const roomId in rooms) {
      const index = rooms[roomId].indexOf(socket.id);
      if (index !== -1) {
        rooms[roomId].splice(index, 1);
        console.log(`User ${socket.id} disconnected from room ${roomId}.`);
        // If the other user is still in the room, notify them
        if (rooms[roomId].length > 0) {
          io.to(roomId).emit("peer_disconnected");
        } else {
          // If the room is now empty, delete it
          delete rooms[roomId];
        }
        break;
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server listening on http://localhost:${PORT}`);
});
