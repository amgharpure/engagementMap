// var data = [require("./dummyData.json")];

const express = require('express');
const app = express();
const http = require('http')
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// MongoDB
const { MongoClient } = require("mongodb");
const path = require("path");
const client = new MongoClient("mongodb+srv://test:test@cluster0.qynhu.mongodb.net/Cluster0?retryWrites=true&w=majority");
client.connect();
collection = client.db("engagementMapDB").collection("feedback");

// For frontend hot reloading
if (process.env.NODE_ENV !== 'production') {
    const livereload = require("livereload");
    const liveReloadServer = livereload.createServer();
    liveReloadServer.watch(path.join(__dirname, 'public'));
    const connectLivereload = require("connect-livereload");
    app.use(connectLivereload());
}

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

const getAggregateData = (data) => {
  // Percentage of engagement and comprehension per section and overall
  const currentData = {}
  data.forEach(item => {
    if (currentData[item.id]) {
      if (parseInt(currentData[item.id]['timestamp']) < parseInt(item['timestamp'])) {
        currentData[item.id] = item
      }
    } else {
      currentData[item.id] = item
    }
  })

  const locationData = { 'front': [], 'left-back': [], 'right-back': [], 'zoom': [] }
  Object.entries(currentData).forEach(([k, v]) => {
    if (v['comprehension'] == '1') v['comprehension'] = '0.34';
    locationData[v['location']].push(v)
  })

  const aggregateData = { 'front': {}, 'left-back': {}, 'right-back': {}, 'zoom': {}, 'overall': {} }
  const overall = 0
  Object.entries(locationData).forEach(([k, v]) => {
    const engagementSum = v.reduce((prev, curr) => prev + parseFloat(curr['engagement']), 0)
    const engagementRatio = engagementSum / v.length

    const comprehensionSum = v.reduce((prev, curr) => prev + parseFloat(curr['comprehension']), 0)
    const comprehensionRatio = comprehensionSum / v.length

    aggregateData[k] = {
      'engagement': engagementRatio || 0,
      'comprehension': comprehensionRatio || 0
    }
  })
  aggregateData['overall'] = {
    'engagement': 0,
    'comprehension': 0
  };

  console.log(locationData)
  console.log(aggregateData)
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
      const data = await collection.find({}).toArray();
      io.emit('dashboard-update', getAggregateData(data));
    } catch {
      console.log('Invalid JSON');
    }
  });
});


server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});

