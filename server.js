var path = require('path');
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

app.use(express.static(__dirname + '/app'));

app.ws('/errors', function(ws, req) {})
app.ws('/db', function(ws, req) {
  ws.on('message', function(data) {
    dbBroadcast(ws)
  })
})
var errWs = expressWs.getWss('/errors');
var dbWs = expressWs.getWss('/db');

function broadcast(msg) {
  errWs.clients.forEach(function(client) {
    client.send(JSON.stringify(msg));
  });
}

function dbBroadcast(ws) {
  dbWs.clients.forEach(function(client) {
    if (client !== ws) {
      client.send(JSON.stringify({
        type: 'update'
      }));
    }
  });
}

app.get('/*', function(req, res) {
  res.sendFile(__dirname + '/app/index.html');
});

process.on('uncaughtException', console.error)

app.listen(3333);

module.exports.broadcast = broadcast;
