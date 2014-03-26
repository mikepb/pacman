#!/usr/bin/env livescript

require! {
  serialport
}

serialport.list (err, ports) !->
  return console.error err if err
  console.log ports

port = '/dev/tty.usbserial-A9007V88'

sp = new serialport.SerialPort port, baudrate: 115200
<-! sp.on \open
console.log "Connected to Twiddlerino at #port"

sp.on \data, !->
  console.log it.to-string!trim!split \\n

impulse = !-> sp.write 'i', (err) !->
# set-interval impulse, 1000
