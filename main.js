const DEVICE_PATH = '/dev/tty.RNBT-2BDF-RNI-SPP'; //'/dev/tty.usbmodem1421';
const serial = chrome.serial;

/* Interprets an ArrayBuffer as UTF-8 encoded string data. */
var ab2str = function(buf) {
  var bufView = new Uint8Array(buf);
  var encodedString = String.fromCharCode.apply(null, bufView);
  return decodeURIComponent(escape(encodedString));
};

/* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
var str2ab = function(str) {
  var encodedString = unescape(encodeURIComponent(str));
  var bytes = new Uint8Array(encodedString.length);
  for (var i = 0; i < encodedString.length; ++i) {
    bytes[i] = encodedString.charCodeAt(i);
  }
  return bytes.buffer;
};

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

var SerialConnection = function() {
  this.connectionId = -1;
  this.lineBuffer = "";
  this.boundOnReceive = this.onReceive.bind(this);
  this.boundOnReceiveError = this.onReceiveError.bind(this);
  this.onConnect = new chrome.Event();
  this.onReadLine = new chrome.Event();
  this.onError = new chrome.Event();
};

SerialConnection.prototype.onConnectComplete = function(connectionInfo) {
  if (!connectionInfo) {
    log("Connection failed.");
    return;
  }
  this.connectionId = connectionInfo.connectionId;
  chrome.serial.onReceive.addListener(this.boundOnReceive);
  chrome.serial.onReceiveError.addListener(this.boundOnReceiveError);
  this.onConnect.dispatch();
};

SerialConnection.prototype.onReceive = function(receiveInfo) {
  if (receiveInfo.connectionId !== this.connectionId) {
    return;
  }

  this.lineBuffer += ab2str(receiveInfo.data);

  var index;
  while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
    var line = this.lineBuffer.substr(0, index + 1);
    this.onReadLine.dispatch(line);
    this.lineBuffer = this.lineBuffer.substr(index + 1);
  }
};

SerialConnection.prototype.onReceiveError = function(errorInfo) {
  if (errorInfo.connectionId === this.connectionId) {
    this.onError.dispatch(errorInfo.error);
  }
};

SerialConnection.prototype.connect = function(path) {
  serial.connect(path, this.onConnectComplete.bind(this))
};

SerialConnection.prototype.send = function(msg) {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.send(this.connectionId, str2ab(msg), function() {});
};

SerialConnection.prototype.disconnect = function() {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.disconnect(this.connectionId, function() {});
};

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

serial.getDevices(function(ports) {

  console.log('fetching ports');
  console.log(ports);

  var selectList = document.querySelector('select#serialPorts');
  for(p in ports) {

    tmpOption = document.createElement("option");
    tmpOption.value = ports[p].path;
    tmpOption.text = ports[p].path;
    selectList.appendChild(tmpOption);
  }
})

var connection = new SerialConnection();

connection.onConnect.addListener(function() {
  log('connected to: ' + DEVICE_PATH);
  connection.send("hello arduino");
});

connection.onReadLine.addListener(function(line) {
  log('read line: ' + line);
});
connectionOpts = {
  'bitrate' : 115200
}


function log(msg) {
  var buffer = document.querySelector('#buffer');
  buffer.innerHTML += msg + '<br/>';
}

var is_on = false;
document.querySelector('button#triggerBtn').addEventListener('click', function() {
  is_on = !is_on;
  connection.send(is_on ? 'y' : 'n');
});

document.querySelector('button#connect').addEventListener('click', function() {
  if (this.innerHTML == 'Disconnect') {
    connection.disconnect();
    
    this.innerHTML = 'Connect';

  } else {
    // get selected port from list
    serialList = document.querySelector('select#serialPorts')

    connection.connect(serialList.value, connectionOpts);
    this.innerHTML = 'Disconnect';
  }
  
});

document.querySelector('select#serialPorts').addEventListener('change', function() {
  console.log(this.value)
});

function $(id) {
  return document.getElementById(id);
}


var port = 9001;
var isServer = false;
if (http.Server && http.WebSocketServer) {
  // Listen for HTTP connections.
  var server = new http.Server();
  var wsServer = new http.WebSocketServer(server);
  server.listen(port);
  isServer = true;

  server.addEventListener('request', function(req) {
    var url = req.headers.url;
    if (url == '/')
      url = '/index.html';
    // Serve the pages of this chrome application.
    req.serveUrl(url);
    return true;
  });

  // A list of connected websockets.
  var connectedSockets = [];

  wsServer.addEventListener('request', function(req) {
    log('Client connected');
    var socket = req.accept();
    connectedSockets.push(socket);

    // When a message is received on one socket, rebroadcast it on all
    // connected sockets.
    socket.addEventListener('message', function(e) {
      log('received: ' + e.data);
      for (var i = 0; i < connectedSockets.length; i++)
        connectedSockets[i].send(e.data + " oyoyoyoy from chrome server");
    });

    // When a socket is closed, remove it from the list of connected sockets.
    socket.addEventListener('close', function() {
      log('Client disconnected');
      for (var i = 0; i < connectedSockets.length; i++) {
        if (connectedSockets[i] == socket) {
          connectedSockets.splice(i, 1);
          break;
        }
      }
    });
    return true;
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // log('This is a test of an HTTP and WebSocket server. This application is ' +
  //     'serving its own source code on port ' + port + '. Each client ' +
  //     'connects to the server on a WebSocket and all messages received on ' +
  //     'one WebSocket are echoed to all connected clients - i.e. a chat ' +
  //     'server. Enjoy!');
  var address = isServer ? 'ws://localhost:' + port + '/' :
      window.location.href.replace('http', 'ws');
  // var ws = new WebSocket(address);
  // ws.addEventListener('open', function() {
  //   log('Connected');
  // });
  // ws.addEventListener('close', function() {
  //   log('Connection lost');
  //   $('input').disabled = true;
  // });
  // ws.addEventListener('message', function(e) {
  //   log(e.data);
  // });
  $('input').addEventListener('keydown', function(e) {
    if (ws && ws.readyState == 1 && e.keyCode == 13) {
      ws.send(this.value);
      this.value = '';
    }
  });
});

