/**
 * Module dependencies.
 */

var _ = require('lodash');

var http = require('http');

var express = require('express');
var socketio = require('socket.io');

var TwiddlerController = require('./lib/twiddler-controller');
var ClientController = require('./lib/client-controller');

// express app

var app = express();

// log requests

app.use(express.logger());

// serve files from ./public

app.use(express.static(__dirname + '/public'));

// listen

var server = http.createServer(app).listen(3000);
var io = socketio.listen(server);
console.log('listening on port 3000');

// controllers

var twiddler = new TwiddlerController();
var clientctrl = new ClientController(io, twiddler);
