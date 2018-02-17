// This is the main script file that the server is running
//

// Treat warnings as errors
"use strict"

var tac = require( "./tacUtils" )

// var express = require( "express" )
var http = require( "http" )
var util = require( "util" )
// var app = express()
var port = process.env.PORT || 8081
var rootPath = "/"
var shouldLogRequests = true
var shouldLogConnections = true
var shouldLogWebsocketData = false
var shouldEchoWebsocketData = true
var shouldPrintEchoWriteResults = false



function TacRootHttpOnGet( request, response )
{
  // Using over port.toString() because it always works
  var text = "Hello world, port: " + String( port )
  response.status( 200 ).send( text )
}

// http.get( rootPath, TacRootHttpOnGet )
//app.get( rootPath, TacRootHttpOnGet )

var server = null

/*
function TacServerOnListen()
{
  TacAssert( port == server.address().port )
  tac.DebugLog( "Listening on port: " + String( port ) )
  // To check how recently nodemon reloaded
}
*/
function TacRequestListener( request, response )
{
  if( shouldLogRequests )
    tac.DebugLog( "TacRequestListener()" )
  response.writeHead( 200, { "Content-Type": "text/plain" } )
  response.write( "Hello World" )
  response.end()
}
tac.DebugLog( "Creating Server" )
var lines =
[
  "",
  "//",
  "// TODO",
  "//",
  "// uhh...",
  "// oh yeah. It would be nice to have a way to visualize variables.",
  "// and tweak them",
  "// SERVERSIDE",
  "//",
  "// ( i need to ask leif )",
  "//",
  "//",
  "",
]
for( let iLine = 0; iLine < lines.length; ++iLine )
{
  var line = lines[ iLine ]
  tac.DebugLog( line )
}
server = http.createServer( TacRequestListener )
server.listen( port )
// server = http.listen( port, TacServerOnListen )
//server = app.listen( port, TacServerOnListen )
function TacServerOnConnection( a, b, c, d )
{
  if( shouldLogConnections )
  {
    tac.DebugLog( "TacServerOnConnection()" )
    var iArg = 0
    for( var arg in arguments )
    {
      tac.DebugLog( iArg )
      tac.DebugLog( arg )
      iArg++
    }
  }
}
server.on( "connection", TacServerOnConnection )

function TacWebsocketOnData( buffer )
{
  var socket = this
  if( shouldLogWebsocketData )
  {
    tac.DebugLog( "TacWebsocketOnData()" )
    tac.DebugLog( buffer.toString() )
  }
  if( shouldEchoWebsocketData )
  {
    // In socket.write( data ), what's the type of data?
    var socketWriteResult = socket.write( buffer )
    if( shouldPrintEchoWriteResults )
    {
      if( socketWriteResult )
      {
        tac.DebugLog( "the entire data was flushed successfully to the kernel buffer" )
      }
      else
      {
        tac.DebugLog( "all or part of the data was queued in user memory" )
      }
    }
  }
}

function TacServerOnUpgrade( request, socket, header )
{
  // can the socket disconnect during this function?
  
  tac.DebugLog( "on upgrade" )
  tac.DebugLog( "header = ", header )
  var headers = 
  [
    "HTTP/1.1 101 Switching Procols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    "Sec-Websocket-Accept: 123",
    "Sec-WebSocket-Protocol: tacbogus"
  ]
  var text = headers.join( "\r\n" )
  text += "\r\n"
  tac.DebugLog( "socket.write: ", text )
  socket.write( text )
  socket.on( "data", TacWebsocketOnData )
}
server.on( "upgrade", TacServerOnUpgrade )

