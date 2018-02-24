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
var shouldLogUpgrade = false
var shouldEchoWebsocketData = false
var shouldLogEchoWriteResults = false
var shouldLogWebsocketClose = true
var userIDCounter = 0
var users = [];
tac.users = users;

/*
function TacFindUserBySocket( socket )
{
  for( let iUser = 0; iUser < tac.users.length; iUser++ )
  {
    var user = tac.users[ iUser ]
    if( user.socket == socket )
      return user
  }
  // does this return null?
}
*/

// return undefined on failure
function TacGetUserIndexBySocket( socket )
{
  for( let iUser = 0; iUser < tac.users.length; iUser++ )
  {
    var user = tac.users[ iUser ]
    if( user.socket == socket )
    {
      return iUser;
    }
  }
}
function TacRemoveSocket( socket )
{
  var iUser = TacGetUserIndexBySocket( socket )
  tac.DebugLog( "iUser: " + iUser )
  tac.users.splice( iUser, 1 )
}


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
function TacServerOnConnection( socket )
{
  if( shouldLogConnections )
  {
    tac.DebugLog( "TacServerOnConnection()" )
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
    if( shouldLogEchoWriteResults )
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


function TacWebsocketOnClose( had_error )
{
  var socket = this
  if( shouldLogWebsocketClose )
  {
    var text = "Websocket on close"
    if( had_error )
      text += " due to transmission error "
    tac.DebugLog( text )
  }
  TacRemoveSocket( socket )
}

function TacServerOnUpgrade( request, socket, header )
{
  // can the socket disconnect during this function?
  
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
  if( shouldLogUpgrade )
  {
    tac.DebugLog( "on upgrade" )
    tac.DebugLog( "header = ", header )
    tac.DebugLog( "socket.write: ", text )
  }
  socket.write( text )
  socket.on( "data", TacWebsocketOnData )
  socket.on( "close", TacWebsocketOnClose )

  var user = {}
  user.socket = socket
  user.userID = userIDCounter++
  tac.users.push( user )
}
server.on( "upgrade", TacServerOnUpgrade )


