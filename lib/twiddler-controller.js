/**
 * Module dependencies.
 */

var _ = require('lodash');
var util = require('util');
var serialport = require('serialport');
var EventEmitter = require('events').EventEmitter;

exports = module.exports = TwiddlerController;

function TwiddlerController(){
  EventEmitter.call(this);
  this._open = this._open.bind(this);
  this._data = this._data.bind(this);
  this._exec = this._exec.bind(this);
  this.commands = [];
  this.listPorts(function(err, ports){
    for (var i = 0; i < ports.length; i++) {
      var port = ports[i];
      if (/usb/.test(port)) {
        this.open(port);
        break;
      }
    }
  }.bind(this));
}

util.inherits(TwiddlerController, EventEmitter);

TwiddlerController.prototype.activation = 150;
TwiddlerController.prototype.threshold = 300;
TwiddlerController.prototype.refactory = 100;

TwiddlerController.prototype.open = function(port){
  if (port == this.port) return this;
  var sp = new serialport.SerialPort(port, { baudrate: 115200 });
  this.close();
  this.port = port;
  this.sp = sp;
  this.sp.on('open', this._open);
  this.sp.on('data', this._data);
  this.emit('open', this);
  return this;
};

TwiddlerController.prototype.close = function(){
  if (this.sp) {
    this.sp.close();
    this.sp = null;
    this.port = null;
  }
  return this;
};

TwiddlerController.prototype.tick = function(what){
  if (this.sp) {
    this.sp.write(what === 'pill' ? 'i' : 'h', function(){});
  }
  return this;
};

TwiddlerController.prototype.listPorts = function(fn){
  serialport.list(function(err, ports){
    fn(err, ports && _.pluck(ports, 'comName'));
  });
};

TwiddlerController.prototype._open = function(){
  console.log("Connected to Twiddlerino on " + this.port);
};

TwiddlerController.prototype._data = function(data){
  var commands = data.toString().trim().split('\n');
  this.commands.push.apply(this.commands, commands);
  this._exec();
};

TwiddlerController.prototype._exec = function(){
  var command = this.commands.shift();
  this.emit('go', command);
  if (this.commands.length) {
    setImmediate(this.exec);
  }
};
