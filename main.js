const serial = chrome.serial;
var connectionOpts = {
  'bitrate' : 9600
};

var sendQueue = [];

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
    console.log("Connection failed.");
    return;
  } else {

  }
  this.connectionId = connectionInfo.connectionId;
  chrome.serial.onReceive.addListener(this.boundOnReceive);
  chrome.serial.onReceiveError.addListener(this.boundOnReceiveError);
  this.onConnect.dispatch();

  jQuery('button#connect').addClass('btn-primary').html('Disconnect');
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

SerialConnection.prototype.sends = function(msg) {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.send(this.connectionId, str2ab(msg), function(sendInfo){}); // end cmd character  
}

SerialConnection.prototype.send = function(msg) {
  var self = this;

  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }

  serial.send(self.connectionId, str2ab(msg), function(sendInfo){}); // end cmd character
  
  
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

  var selectList = document.querySelector('select#serialPorts');
  for(p in ports) {
    tmpOption = document.createElement("option");
    tmpOption.value = ports[p].path;
    tmpOption.text = ports[p].path;
    selectList.appendChild(tmpOption);
  }

});

var connection = new SerialConnection();

connection.onConnect.addListener(function() {
  console.log('connected to: ' + DEVICE_PATH);
  // connection.send("hello arduino");
});

connection.onReadLine.addListener(function(data) {
  console.log('serial: ' + data);
  var jsonData = JSON.stringify({
    type:'serial',
    data:data.trim()
  });
  for (var i = 0; i < connectedSockets.length; i++) {
    connectedSockets[i].send(jsonData);

  }

});


document.querySelector('button#connect').addEventListener('click', function() {
  
  if (this.innerHTML == 'Disconnect') {
    connection.disconnect();
    this.innerHTML = 'Connect';
    jQuery(this).removeClass('btn-primary')

  } else {
    // get selected port from list
    serialList = document.querySelector('select#serialPorts')
    connection.connect(serialList.value, connectionOpts);
    // this.innerHTML = 'Disconnect';
  }
  
});


function $(id) {
  return document.getElementById(id);
}

/////////////////////////////////////////////
// Websocket Server
/////////////////////////////////////////////

var port = 9001;
var isServer = false;

// A list of connected websockets.
var connectedSockets = [];


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


  wsServer.addEventListener('request', function(req) {
    
    console.log('Client connected');
    
    var socket = req.accept();
    connectedSockets.push(socket);

    // When a message is received on one socket, rebroadcast it on all
    // connected sockets.
    socket.addEventListener('message', function(e) {
      
      var socketData = JSON.parse(e.data);
      console.log(socketData);
      
      
      if (socketData.value != "*") {
        var tmpVal = socketData.value.toString();
        if (tmpVal.length == 1) {
          tmpVal = "00" + tmpVal;
        } else if (tmpVal.length == 2) {
          tmpVal = "0" + tmpVal;
        }
        var valueToSendPrepared =  tmpVal; // data['value'].encode('ascii','ignore');
        console.log("value to send: " + valueToSendPrepared);
        
      } else {
        var valueToSendPrepared = "**" + socketData.value.toString();
      }

      var cmdReceived = socketData.cmd;
      if (capacita.controllerMap.hasOwnProperty(cmdReceived)) {
        var cmdToSend = capacita.controllerMap[cmdReceived];

        connection.send(cmdToSend+valueToSendPrepared);

        // console.log(cmdToSend + " " + valueToSendPrepared);
      }

      
    });

    // When a socket is closed, remove it from the list of connected sockets.
    socket.addEventListener('close', function() {
      console.log('Client disconnected');
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


