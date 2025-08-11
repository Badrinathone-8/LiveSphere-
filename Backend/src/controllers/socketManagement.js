// socketManagement.js
// Usage: require this and call initSocket(io) from your server setup
// Example in app.js:
// const { initSocket } = require('./socketManagement');
// const io = new Server(httpServer, { cors: { origin: '*' } });
// initSocket(io);

const rooms = {}; // rooms[roomId] = [{ socketId, username }, ...]
const messages = {}; // messages[roomId] = [{ sender, text, socketId }...]

export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("user connected", socket.id);

    socket.on("join-call", ({ room, username }) => {
      if (!room) {
        console.warn("join-call missing room");
        return;
      }

      // join socket.io room for convenience
      socket.join(room);

      if (!rooms[room]) rooms[room] = [];
      rooms[room].push({ socketId: socket.id, username: username || "Anonymous" });

      // send existing clients to the new user
      const clients = rooms[room].map((c) => ({ socketId: c.socketId, username: c.username }));
      io.to(socket.id).emit("room-clients", { clients });

      // notify others that a new user joined
      socket.to(room).emit("user-joined", { socketId: socket.id, username: username || "Anonymous" });

      // optionally send stored messages
      const msgs = messages[room] || [];
      io.to(socket.id).emit("chat-history", msgs);
    });

    // forwarding signaling messages: (toId, payload)
    socket.on("signal", (toId, payload) => {
      // payload must contain { type: "sdp"|"ice", sdp?, candidate?, username? }
      if (!toId) return;
      // forward to the target socket
      io.to(toId).emit("signal", socket.id, payload);
    });

    // chat messages
    socket.on("chat-message", (data, sender) => {
      // find which room this socket is in
      const joinedRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      const room = joinedRooms[0]; // assume single room per socket
      if (!room) return;

      if (!messages[room]) messages[room] = [];
      messages[room].push({ sender: sender || "Anonymous", text: data, socketId: socket.id });

      // broadcast to everyone in room (including sender)
      io.to(room).emit("chat-message", data, sender || "Anonymous");
    });

    socket.on("disconnect", () => {
      console.log("user disconnected", socket.id);
      // remove from rooms
      for (const [roomId, arr] of Object.entries(rooms)) {
        const idx = arr.findIndex((x) => x.socketId === socket.id);
        if (idx !== -1) {
          arr.splice(idx, 1);
          // notify everyone in room
          socket.to(roomId).emit("user-left", socket.id);
        }
        if (arr.length === 0) delete rooms[roomId];
      }
    });
  });
}

