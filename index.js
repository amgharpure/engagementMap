const data = require("./dummyData.json");

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

const getAggregateData = () => {
    // FIXME: Get data from firebase, comment out line getting dummy data
    // Percentage of engagement and comprehension per section and overall
    const currentData = {}
    data.forEach(item => {
        if (currentData[item.id]) {
            if (currentData[item.id]['timestamp'] > item['timestamp']) {
                currentData[item.id] = item
            }
        } else {
            currentData[item.id] = item
        }
    })

    const locationData = {'front': [], 'left-back': [], 'right-back': [], 'zoom': []}
    Object.entries(currentData).forEach(([k, v]) => {
        locationData[v['location']].push(v)
    })

    const aggregateData = {'front': {}, 'left-back': {}, 'right-back': {}, 'zoom': {}, 'overall': {}}
    const overall = 0
    Object.entries(locationData).forEach(([k, v]) => {
        const engagementRatio = 0
        const comprehensionRatio = 0
        aggregateData[k] = {
            'engagement': engagementRatio,
            'comprehension': comprehensionRatio
        }
    })
    aggregateData['overall'] = {
        'engagement': 0,
        'comprehension': 0
    };

    console.log(locationData)
    return aggregateData
}

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on('feedback', async (msg) => {
        try {
            const msgJson = JSON.parse(msg);
            const userId = msgJson.id;
            await collection.insertOne(msgJson);
            io.emit('dashboard-update', getAggregateData());
        } catch {
            console.log('Invalid JSON');
        }
    });
});


server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});

