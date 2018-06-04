(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
// This is the main script file that the client is running

// Treat warnings as errors
"use strict"

var tac = require( "./tacUtils" )

console.log( "hello world client" )
tac.DebugLog( "hello world client tac.DebugLog" )

// var client = null

//
//
//

function CreateButton(
  functionThis,
  buttonName,
  functionName,
  functionArgs )
{
  console.log( "CreateButton this: " + this )
  var parentThis = this
  var button = document.createElement( "button" )
  button.innerHTML = buttonName
  document.body.appendChild( button )
  button.addEventListener( "click", function() { functionName.apply( functionThis, functionArgs ) } )

  var linebreak = document.createElement( "br" )
  document.body.appendChild( linebreak )
}

function SetDisplay( text )
{
  var element = document.getElementById( "display" )
  element.innerHTML = text
}

function DumpIt()
{
  var thisAsAString = JSON.stringify( this, null, "\t" )
  SetDisplay( thisAsAString )
}

function testButton( arg0, arg1 )
{
  console.log( "Test button!!!" )
  console.log( "arg0: " + arg0 )
  console.log( "arg1: " + arg1 )
  console.log( "this: " + this )
  console.log( "this.foo: " + this.foo )
  console.log( "this.bar: " + this.bar )
}

function Client ()
{
  this.foo = "hi"
  this.bar = function() { SetDisplay( "bar" ) }
  this.qux = function() { SetDisplay( "qux" ) }
  this.windowLocation = "" + window.location.host

  this.Hello();
  CreateButton( this, "test button", testButton, [ "hello", 69 ] )
  CreateButton( this, "Dump It", DumpIt )
  CreateButton( this, "Reload", function(){ window.location.reload( true ) } )
  CreateButton( this, "Print Socket Ready State", this.PrintSocketReadyState )
  CreateButton( this, "Send message to server", function(){
    if( this.socket )
      this.socket.send( "Ping" )
  } )
  CreateButton( this, "Add socket", this.AddSocket )

  this.AddSocket();
  this.PrintSocketReadyState();

  this.timestampMsCreation = performance.now()

  var para = document.createElement( "p" )
  para.innerHTML = "time node"
  document.body.appendChild( para )
  this.timeNode = para
  this.UpdateRequest()
}

Client.prototype.PrintSocketReadyState  = function ()
{
  var socket = this.socket
  if( socket == null )
  {
    SetDisplay( "socket is null" )
    return
  }
  var readyStates =
  [
    [ "CONNECTING", "The connection is not yet open" ],
    [ "OPEN", "The connection is open and ready to communicate." ],
    [ "CLOSING", "The connection is in the process of closing." ],
    [ "CLOSED", "The connection is closed or couldn't be opened." ],
  ]
  var readyState = readyStates[ socket.readyState ]
  var text = 
    "Ready State " +
    socket.readyState +
    " " +
    readyState[ 0 ] +
    " " + 
    readyState[ 1 ]
  SetDisplay( text )
}

Client.prototype.Hello = function()
{
  console.log( "Client.prototype.Hello()" )
}

Client.prototype.UpdateRequest = function()
{
  window.requestAnimationFrame( this.Update.bind( this ) )
}
Client.prototype.Update = function( timestampMs )
{
  var deltaTime = timestampMs - this.timestampMsCreation

  var names = [ "msec", "sec", "min", "hr", "day" ]
  var times = [ 1000,   60,    60,    60,   24    ]

  var text = ""
  var i = 0
  console.assert( names.length == times.length )
  while( Math.floor( deltaTime ) > 0 && i < names.length )
  {
    var time = times[ i ]
    var elapsed = Math.floor( deltaTime % time )
    var name = names[ i ] + ( elapsed == 1 ? "" : "s" )
    deltaTime /= time
    i++
    text = elapsed + " " + name + " " + text
  }

  var timeNode = this.timeNode
  console.assert( timeNode )
  console.assert( timeNode.innerHTML )
  timeNode.innerHTML = text
  this.UpdateRequest()
}

Client.prototype.AddSocket = function ()
{
  var client = this
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism
  // The WebSocket() constructor does all the work of creating an initial HTTP/1.1
  // connection then handling the handshaking and upgrade process for you.
  //
  console.log( this )


  // var myTCPSocket = new TCPSocket()

  var socket = null
  try
  {
    socket = new WebSocket( "ws://" + window.location.host, "tacbogus" )
    // socket = new WebSocket( "ws://echo.websocket.org" )
    console.assert( socket.binaryType )
    socket.binaryType = "arraybuffer"
      
  }
  catch( e )
  {
    console.log( "Caught error: " + String( e ) )
  }


  this.socket = socket
  socket.onclose = function( closeEvent )
  {
    console.log( "Socket closed - " + String( closeEvent ) )
    console.log( closeEvent )
    console.log( closeEvent.code )
    console.log( closeEvent.reason )
    console.log( closeEvent.wasClean )
  }
  socket.onopen = function ()
  {
    client.PrintSocketReadyState();
    console.log( "Connected to server" )
    console.log( "Socket sending ping to server" )
    socket.send( "Ping" )
  }
  socket.onerror = function( error )
  {
    console.log( "WebSocket Error " + error)
  }
  socket.onmessage = function( e )
  {
    console.log( "WebSocket message from server : " + e.data )
    console.log( e )
    console.log( e.data )
    var buffer = e.data
    var bufferView = new Uint8Array( buffer )
    var maskedPayloadString = String.fromCharCode.apply( null, bufferView );
    console.log( maskedPayloadString )
  }
}

window.onload = function()
{
  // client = new Client
  new Client
}


},{"./tacUtils":3}],3:[function(require,module,exports){
(function (process){
// This file is include by both client & server code, so it can't include node stuff

"use strict"

var tac =
{
  IsDebug: null,
  Assert: null,
  DebugLog: null
}

tac.ClearConsole = function()
{
  // https://stackoverflow.com/questions/9006988/node-js-on-windows-how-to-clear-console
  // TODO: cross platform?
  // TODO: how does this work?
  // TODO: does this work?
  console.log( "\u001b[2J\u001b[0;0H" )
}

tac.IsDebug = function()
{
  // as opposed to production
  // If using express, this is app.get( "env" ) == "development"
  return !process.env.NODE_ENV || process.env.NODE_ENV == "development"
}

tac.isLittleEndian = new Uint8Array( new Uint32Array( [ 0x12345678 ] ).buffer )[ 0 ] == 0x78

tac.Assert = function( value )
{
  if( !tac.IsDebug() )
    return
  console.assert( value )
}

tac.DebugLog = function( ...args )
{
  function Pad( number )
  {
    if( number < 10 )
      return "0" + number
    return number
  }

  if( !tac.IsDebug() )
    return
  var now = new Date()
  var line =
    // ISO 8601
    new Date().toISOString() + " "
  for( var arg of args )
  {
    var argString = ""
    if( typeof arg == "object" )
      argString = JSON.stringify( arg, null, "\t" )
    else
      argString = String( arg )
    line += argString + " "
  }

  console.log( line )

  if( tac.DebugLogPost )
  {
    tac.DebugLogPost( line )
  }
}

module.exports = tac


}).call(this,require('_process'))
},{"_process":1}]},{},[2]);
