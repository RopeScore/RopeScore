var path = require('path');
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

app.use(express.static(__dirname + '/app'));

app.ws('/errors', function(ws, req) {})
var errWs = expressWs.getWss('/errors');

function broadcast(msg) {
  errWs.clients.forEach(function(client) {
    client.send(JSON.stringify(msg));
  });
}

app.get('/*', function(req, res) {
  res.sendFile(__dirname + '/app/index.html');
});

process.on('uncaughtException', console.error)

app.listen(3333);

module.exports.broadcast = broadcast;
