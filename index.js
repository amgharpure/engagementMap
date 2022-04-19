const express = require('express');
const app = express();
const http = require('http')
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// MongoDB
const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb+srv://test:test@cluster0.qynhu.mongodb.net/Cluster0?retryWrites=true&w=majority");
client.connect();
collection = client.db("engagementMapDB").collection("feedback");

// For frontend hot reloading
const livereload = require("livereload");
const liveReloadServer = livereload.createServer();
const path = require("path");
liveReloadServer.watch(path.join(__dirname, 'public'));
const connectLivereload = require("connect-livereload");
app.use(connectLivereload());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/student', (req, res) => {
  res.sendFile(__dirname + '/public/student.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

io.on('connection', (socket) => {
  socket.broadcast.emit('hi');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('feedback', async (msg) => {
    try {
      msgJson = JSON.parse(msg);
      console.log(msgJson);
      userId = msgJson.id;
      await collection.insertOne(msgJson);
      io.emit('dashboard-update', 'new feedback from ' + userId);
    }
    catch {
      console.log('Invalid JSON');
      return;
    }
  });
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});
