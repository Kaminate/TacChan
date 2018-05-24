// This is the main script file that the server is running
//






// Treat warnings as errors
"use strict"

var tac = require( "./tacUtils" )
var http = require( "http" )
var util = require( "util" )
var fs = require( "fs" )
var crypto = require( "crypto" );
var port = process.env.PORT || 8081
var rootPath = "/"
var shouldLogRequests = true
var shouldLogConnections = true
var shouldLogWebsocketData = true
var shouldLogUpgrade = true
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

function TacClearConsole()
{
  // https://stackoverflow.com/questions/9006988/node-js-on-windows-how-to-clear-console
  // TODO: cross platform?
  // TODO: how does this work?
  console.log( "\u001b[2J\u001b[0;0H" )
}


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
  return TacGetUserInfoBySocket( socket ).user
}

function TacRemoveSocket( socket )
{
  var userInfo = TacGetUserInfoBySocket( socket )
  var iUser = userInfo.iUser
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
  {
    tac.DebugLog( "TacRequestListener()" )
    tac.DebugLog( "request.url: " + request.url )
  }

  function GetContentType( filepath )
  {
    // wikipedia.org/wiki/Media_type
    var dotoffset = filepath.lastIndexOf( "." )
    var fileExtension = filepath.substr( dotoffset + 1 )
    var mapping = {}
    mapping[ "css"  ] = "text/css"
    mapping[ "gif"  ] = "image/gif"
    mapping[ "html" ] = "text/html"
    mapping[ "ico"  ] = "image/x-icon"
    mapping[ "jpg"  ] = "image/jpeg"
    mapping[ "js"   ] = "text/javascript"
    mapping[ "png"  ] = "image/png"
    var result = mapping[ fileExtension ]
    if( result == undefined )
      return "text/plain"
    return result
  }

  function TrySendFileToClient( response, filepath )
  {
    var allowedFiles = [
      "favicon.ico",
      "dat.gui.min.js",
      "tacClient.js",
      "tacClient.html" ]
    var included = allowedFiles.includes( filepath )
    if( !included )
    {
      tac.DebugLog( "Refuse to send file " + filepath )
      return
    }
    function OnReadFile( err, buffer )
    {
      if( err )
        throw err
      tac.DebugLog( "sent file " + filepath )
      var contentType = GetContentType( filepath )
      response.writeHead( 200, { "Content-Type": contentType } )
      response.write( buffer )
      response.end()
    }
    fs.readFile( filepath, OnReadFile )
  }

  // remove the first "/" character
  var filepath = request.url.substring( 1 )
  if( filepath == "" )
    filepath = "tacClient.html"
  TrySendFileToClient( response, filepath )
}
tac.DebugLog( "Creating Server" )

var lines =
[
  "",
  "//",
  "// TODO",
  "// Make game",
  "//",
  "",
  "",
  "",
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

  function TacNormalSocketOnData( buffer )
  {
    var socket = this
    var bufferString = buffer.toString()
    tac.DebugLog( "TacNormalSocketOnData()" + bufferString )
  }
  socket.on( "data", TacNormalSocketOnData )
  // socket.write( "hellooooooo" )
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
  var errorMessage = error.toString()
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


function TacWebsocketOnClose( hadError )
{
  var socket = this
  if( shouldLogWebsocketClose )
  {
    var text = "Websocket on close"
    if( hadError )
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
  var handshakeKey = request.headers[ "sec-websocket-key" ] // example: "zw8JOb8Onj6QkGMrz+waBQ=="
  var handshakeSuffix = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
  // var handshakeHash = Sha1Hash( handshakeKey + handshakeSuffix )
  // var handshakeResult = Base64Encode( handshakeHash )
  var handshakeResult = crypto.createHash( "sha1" )
    .update(  handshakeKey + handshakeSuffix, "binary" )
    .digest( "base64" )
  var handshakeResult2 = crypto.createHash( "sha1" )
    .update(  handshakeKey + handshakeSuffix )
    .digest( "base64" )
  var handshakeResult3 = crypto.createHash( "sha1" )
    .update(  handshakeKey + handshakeSuffix, "ascii" )
    .digest( "base64" )

  
  var headers = 
  [
    "HTTP/1.1 101 Switching Procols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    "Sec-Websocket-Accept: " + handshakeResult,
    // "Sec-WebSocket-Protocol: tacbogus"
    //"HTTP/1.1 101 Web Socket Protocol Handshake",
    //"Upgrade: WebSocket",
    //"Connection: Upgrade",
  ]
  var text = headers.join( "\r\n" ) + "\r\n";
  if( shouldLogUpgrade )
  {
    tac.DebugLog( "on upgrade" )
    tac.DebugLog( "header = ", header.toString() )
    tac.DebugLog( "request.headers = ", request.headers )
    tac.DebugLog( "header handshakeKey      = ", handshakeKey )
    tac.DebugLog( "header handshakeResult 1 = ", handshakeResult )
    tac.DebugLog( "header handshakeResult 2 = ", handshakeResult2 )
    tac.DebugLog( "header handshakeResult 3 = ", handshakeResult3 )
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

