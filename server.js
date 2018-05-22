// This is the main script file that the server is running
//






// Treat warnings as errors
"use strict"

var tac = require( "./tacUtils" )
var http = require( "http" )
var util = require( "util" )
var port = process.env.PORT || 8081
var rootPath = "/"
var shouldLogRequests = true
var shouldLogConnections = true
var shouldLogWebsocketData = true
var shouldLogUpgrade = false
var shouldEchoWebsocketData = true
var shouldLogWebsocketClose = true
var shouldLogWebsocketEnd = true
var shouldLogWebsocketError = true
var shouldLogWebsocketTimeout = true
// mirrored in tacscriptgameclient.h
var MatchMessageCreateRoom = "create room"
var userIDCounter = 0
var users = []
tac.users = users

var rooms = []
tac.rooms = rooms

function TacGetUserInfoBySocket( socket )
{
  for( let iUser = 0; iUser < tac.users.length; iUser++ )
  {
    var user = tac.users[ iUser ]
    if( user.socket == socket )
    {
      var userInfo = {}
      userInfo.iUser = iUser
      userInfo.user = user
      return userInfo
    }
  }
}

function TacGetUserBySocket( socket )
{
  return TacGetUserInfoBySocket( socket ).user;
}

function TacRemoveSocket( socket )
{
  var userInfo = TacGetUserInfoBySocket( socket )
  var iUser = userInfo.iUser;
  if( shouldLogWebsocketClose )
  {
    tac.DebugLog( "Removed iUser " + iUser )
  }
  tac.users.splice( userInfo.iUser, 1 )
}

var server = null

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
function TacServerOnConnection( socket )
{
  if( shouldLogConnections )
  {
    tac.DebugLog( "TacServerOnConnection()" )
  }
}
server.on( "connection", TacServerOnConnection )


function TacMatchMessageOnCreateRoom( user )
{
  var socket = user.socket
  tac.DebugLog( "Create room request received" )
  if( user.room )
  {
    socket.write( "You are already in a room" )
    return
  }
  var room = {}
  room.users = [ user ]
  user.room = room
  tac.rooms.push( room )
  socket.write( "Created room" )
}

function TacWebsocketOnData( buffer )
{
  var socket = this
  var user = TacGetUserBySocket( socket )
  var bufferString = buffer.toString()
  if( bufferString == MatchMessageCreateRoom )
    TacMatchMessageOnCreateRoom( user )

  if( shouldLogWebsocketData )
  {
    tac.DebugLog( "TacWebsocketOnData()" + bufferString )
  }
  if( shouldEchoWebsocketData )
  {
    socket.write( buffer )
  }
}

function TacWebsocketOnTimeout()
{
  if( shouldLogWebsocketTimeout )
  {
    tac.DebugLog( "Websocket on timeout" )
  }
}

function TacWebsocketOnError( error )
{
  var errorMessage = error.toString();
  if( shouldLogWebsocketError )
  {
    tac.DebugLog( "Websocket on error " + errorMessage )
  }
}

function TacWebsocketOnEnd()
{
  var socket = this // is this true?
  if( shouldLogWebsocketEnd )
  {
    tac.DebugLog( "Websocket on end( other end sent a FIN packet )" )
  }
}


function TacWebsocketOnClose( had_error )
{
  var socket = this
  if( shouldLogWebsocketClose )
  {
    var text = "Websocket on close"
    if( had_error )
      text += "( due to transmission error )"
    else
      text += "( not due to transmission error )"

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
  socket.on( "end", TacWebsocketOnEnd )
  socket.on( "error", TacWebsocketOnError )
  socket.on( "timeout", TacWebsocketOnTimeout )


  var user = {}
  user.socket = socket
  user.userID = userIDCounter++
  tac.users.push( user )
}
server.on( "upgrade", TacServerOnUpgrade )


