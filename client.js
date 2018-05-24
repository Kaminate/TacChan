// This is the main script file that the client is running

// Treat warnings as errors
"use strict"

console.log( "hello world client" )

var client = null

/////////////////////////

var Client = function()
{
  function SetDisplay( text )
  {
    var element = document.getElementById( "display" )
    element.innerHTML = text
  }

  SetDisplay( "World" )

  this.foo = "hi"
  this.bar = function() { SetDisplay( "bar" ) }
  this.qux = function() { SetDisplay( "qux" ) }
  this.windowLocation = "" + window.location.host


  function AddSocket()
  {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism
    // The WebSocket() constructor does all the work of creating an initial HTTP/1.1
    // connection then handling the handshaking and upgrade process for you.
    var socket = new WebSocket( "ws://" + window.location.host )

    /*
    var lines = [
      "GET /chat HTTP/1.1",
      "Host: example.com:8000",
      "Upgrade: websocket",
      "Connection: Upgrade",
      "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
      "Sec-WebSocket-Version: 13" ]
    var text = "";
    for( var line in lines )
    {
      text += line
      text += "\r\n"
    }
    socket.send( text )
    */

    client.socket = socket
    socket.addEventListener( "open", function( event )
    {
        socket.send( "Hello Server!" );
    } );
    socket.addEventListener( "message", function( event )
    {
        console.log( "Message from server ", event.data );
    } );
    socket.onopen = function()
    {
      console.log( "Connected to server" )
    }
    socket.onopen = function ()
    {
      socket.send( "Ping" )
    }
    socket.onerror = function( error )
    {
      console.log( "WebSocket Error " + error)
    }
    socket.onmessage = function( e )
    {
      console.log( "Server: " + e.data )
    }
  }
  this.RequestState = function()
  {

  }

  function DumpIt()
  {
    var thisAsAString = JSON.stringify( client, null, "\t" )
    SetDisplay( thisAsAString )
  }

  function PrintSocketReadyState ()
  {
    if( client.socket == null )
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
    var readyState = readyStates[ client.socket.readyState ]
    var text = 
      "Ready State " +
      client.socket.readyState +
      " " +
      readyState[ 0 ] +
      " " + 
      readyState[ 1 ]
    SetDisplay( text )
  }

  SetDisplay( JSON.stringify( this.socket, null, "\t" ) )


  function CreateButton( name, onClick )
  {
    var button = document.createElement( "button" )
    var buttonText = document.createTextNode( name )
    button.appendChild( buttonText )
    document.body.appendChild( button )
    button.addEventListener( "click", onClick )

    var linebreak = document.createElement( "br" )
    document.body.appendChild( linebreak )
  }

  CreateButton( "Dump It", DumpIt )
  CreateButton( "Print Socket Ready State", PrintSocketReadyState )
  CreateButton( "Send message to server", function(){ console.log( "TODO" ) } )
  CreateButton( "Add socket", AddSocket )


}

window.onload = function()
{
  client = new Client
}

