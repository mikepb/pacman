/**
 * Module dependencies.
 */

var _ = require('lodash');
var util = require('util');
var serialport = require('serialport');
var EventEmitter = require('events').EventEmitter;

exports = module.exports = ClientController;

function ClientController(io, twiddler){
  EventEmitter.call(this);
  this._connection = this._connection.bind(this);
  this._listPorts = this._listPorts.bind(this);
  this._go = this._go.bind(this);
  this.io = io;
  this.io.sockets.on('connection', this._connection);
  this.twiddler = twiddler;
  this.twiddler.on('go', this._go);
}

util.inherits(ClientController, EventEmitter);

ClientController.prototype._connection = function(socket){
  socket.on('list ports', this._listPorts);
  socket.on('set port', this._setPort(socket));
  // socket.on('disconnect', this._disconnect);
  this._sendPorts(socket);
};

ClientController.prototype._listPorts = function(fn){
  this.twiddler.listPorts(function(err, ports){
    fn(err, ports, this.twiddler.port);
  }.bind(this));
};

ClientController.prototype._setPort = function(socket){
  return function(port, fn){
    if (!port) {
      this.twiddler.close();
    } else {
      try {
        this.twiddler.open(port);
      } catch (err) {
        console.error(err);
        fn(err.message);
        return;
      }
    }
    fn();
    this.twiddler.listPorts(function(err, ports){
      socket.broadcast.emit('set port', err, ports, this.twiddler.port);
    }.bind(this));
  }.bind(this);
};

ClientController.prototype._sendPorts = function(socket){
  this.twiddler.listPorts(function(err, ports){
    socket.emit('set port', err, ports, this.twiddler.port);
  }.bind(this));
};

ClientController.prototype._go = function(dir){
  this.io.sockets.emit('go', dir);
};
