const data = require("./dummyData.json");

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

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

const getAggregateData = () => {
    // FIXME: Get data from firebase, comment out line getting dummy data
    return data
}

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on('feedback', (msg) => {
        try {
            const msgJson = JSON.parse(msg);
            console.log(msgJson);
            const userId = msgJson.id;
            io.emit('dashboard-update', getAggregateData());
        } catch {
            console.log('Invalid JSON');
        }
    });
});


server.listen(3000, () => {
    console.log('listening on *:3000');
});
