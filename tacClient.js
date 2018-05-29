// This is the main script file that the client is running

// Treat warnings as errors
"use strict"

console.log( "hello world client" )

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

var Client = function()
{

  this.foo = "hi"
  this.bar = function() { SetDisplay( "bar" ) }
  this.qux = function() { SetDisplay( "qux" ) }
  this.windowLocation = "" + window.location.host

  this.Hello();
  CreateButton( this, "test button", testButton, [ "hello", 69 ] )
  CreateButton( this, "Dump It", DumpIt )
  CreateButton( this, "Print Socket Ready State", this.PrintSocketReadyState )
  CreateButton( this, "Send message to server", function(){
    if( this.socket )
      this.socket.send( "Ping" )
 } )
  CreateButton( this, "Add socket", this.AddSocket )

  this.AddSocket();
  this.PrintSocketReadyState();

  this.timestampMsCreation = performance.now()
  this.elapsedMs = 0

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

  this.elapsedMs = timestampMs - this.timestampMsCreation

  var timeNode = this.timeNode
  console.assert( timeNode )
  console.assert( timeNode.innerHTML )
  timeNode.innerHTML = "seconds: " + Math.floor( this.elapsedMs / 1000 )
  this.UpdateRequest()
}

Client.prototype.AddSocket = function ()
{
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism
    // The WebSocket() constructor does all the work of creating an initial HTTP/1.1
    // connection then handling the handshaking and upgrade process for you.
    //
    console.log( this )


    // var myTCPSocket = new TCPSocket()

    var socket = null
    try
    {
      // socket = new WebSocket( "ws://" + window.location.host, "tacbogus" )
      socket = new WebSocket( "ws://echo.websocket.org" )
        
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
    }
}

window.onload = function()
{
  // client = new Client
  new Client
}

