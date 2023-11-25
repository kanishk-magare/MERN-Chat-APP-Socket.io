const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express(); // Create an Express application.
const server = http.createServer(app); // Create an HTTP server using the Express app.
const io = socketIo(server); // Integrate Socket.IO to work with the server.
const ip = "192.168.0.136"; // Set the IP address.

const connectedUsers = new Map(); // Create a Map to store connected users and their sockets.

app.use(express.static(__dirname)); // Serve static files from the current directory.

io.on('connection', (socket) => {
  // When a user connects to the server using a socket...
  console.log('User connected'); // Log a message indicating a user has connected.

  socket.on('user connected', (userName) => {
    // When a user sends a 'user connected' event with their name...
    connectedUsers.set(userName, socket); // Store the user's name and socket in the map.
    io.emit('chat message', { message: `${userName} joined the chat.`, sender: 'Server' }); // Send a chat message that the user has joined.
    io.emit('userList', Array.from(connectedUsers.keys())); // Send the updated user list to all clients.
  });

  socket.on('private message', ({ to, message, sender }) => {
    // When a private message is sent...
    const recipientSocket = connectedUsers.get(to); // Get the recipient's socket based on their name.
    if (recipientSocket) {
      recipientSocket.emit('chat message', { message, sender }); // Send the private message to the recipient.
    }
  });

  socket.on('chat message', function(data) {
    // When a chat message is received...
    io.emit('chat message', { message: data.message, sender: data.sender }); // Send the chat message to all connected clients.
  });

  socket.on('user disconnected', (userName) => {
    // When a user disconnects from the chat...
    connectedUsers.delete(userName); // Remove the user from the connected users map.
    io.emit('userList', Array.from(connectedUsers.keys())); // Update and send the updated user list to all clients.
    io.emit('chat message', { message: `${userName} left the chat.`, sender: 'Server' }); // Notify all users that a user has left.
  });

  socket.on('disconnect', () => {
    // When a user's socket disconnects...
    console.log('User disconnected'); // Log a message indicating a user has disconnected.
    const userName = Array.from(connectedUsers).find(([_, value]) => value === socket); // Find the username based on the socket.
    if (userName) {
      connectedUsers.delete(userName); // Remove the disconnected user from the map.
      io.emit('userList', Array.from(connectedUsers.keys())); // Update and send the updated user list to all clients.
      io.emit('chat message', { message: `${userName} left the chat.`, sender: 'Server' }); // Notify all users that a user has left.
    }
  });
});

server.listen(3030, ip, () => {
  // Start the server to listen on the specified IP and port.
  console.log(`Server is running on http://${ip}:3030`);
});
