// This is the main script file that the server is running
//






// Treat warnings as errors
"use strict"

var usingWS = false
var WebSocket = null
if( usingWS )
{
  WebSocket = require( "ws" );
}

var tac = require( "./tacUtils" )
var http = require( "http" )
var util = require( "util" )
var fs = require( "fs" )
var crypto = require( "crypto" );
var express = null
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

// begin express vars
var shouldUseExpress = false
var app = null
if( shouldUseExpress )
{
  express = require( "express" )
  // app is a javascript function, designed to be passed to node's HTTP servers
  // as a callback to handle requests
  app = express()
}
// end express vars


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

if( shouldUseExpress )
{
  server = http.createServer( app )
  // server.on( "request", TacRequestListener )
  app.get( "/", TacRequestListener )
  // __dirname is a string that evaluates to the cur module dir
  tac.DebugLog( "Static dir: " + __dirname )
  app.use( express.static( __dirname ) )

}
else
{
  server = http.createServer( TacRequestListener )
  //server = new http.createServer()
}

var wss = null
if( usingWS )
{
  wss = new WebSocket.Server( { server } )
  function WSIncomingMessage( message )
  {
    var ws = this
    console.log( "Recieved" + message )
    console.log( message )
    ws.send( "ws pong " + message )
  }
  function WSSConnection( ws )
  {
    ws.on( "message", WSIncomingMessage )
    ws.send( "something" )
  }
  wss.on( "connection", WSSConnection )
}





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

// server.on( "connection", TacServerOnConnection )
//




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

function TacEatNetworkBytes( bytes, byteOffset, byteCount )
{
  var result = 0
  var shiftBitDelta = tac.isLittleEndian ? -8 : 8
  var shiftBits = tac.isLittleEndian ? 0 : ( byteCount - 1 ) * 8
  for( var i = 0; i < byteCount; ++i )
  {
    var subResult = bytes[ byteOffset + i ]
    result += subResult << shiftBits
    shiftBits += shiftBitDelta
  }
  return result
}

function TacSpitNetworkBytes( bytes, byteOffset, byteCount, value )
{
  var shiftBitDelta = tac.isLittleEndian ? -8 : 8
  var shiftBits = tac.isLittleEndian ? ( byteCount - 1 ) * 8 : 0

  for( var iByte = 0; iByte < byteCount; ++iByte )
  {
    var curByte = ( value >> shiftBits ) & 8
    bytes[ byteOffset + iByte ] = curByte
    shiftBits += shiftBitDelta
  }
}

function TacGetPayload7Bit( payloadByteCount )
{
  if( payloadByteCount < 126 )
    return payloadByteCount
  if( payloadByteCount >= ( 1 << 16 ) )
    return 127
  return 126
}

var maskByteCount = 4

function TacWebsocketSend( socket, bytes )
{
  console.assert( bytes instanceof Uint8Array )
  var toWriteByteCount = 2;
  var payload7Bit = TacGetPayload7Bit( bytes.length )
  var payload7BitExtByteCount = 0
  if( payload7Bit == 126 )
    payload7BitExtByteCount = 2
  if( payload7Bit == 127 )
    payload7BitExtByteCount = 8
  toWriteByteCount += payload7BitExtByteCount
  toWriteByteCount += bytes.length
  var toWrite = new Uint8Array( toWriteByteCount )

  var iByte = 0

  var fin = 1
  var rsv1 = 0
  var rsv2 = 0
  var rsv3 = 0
  var opcode = 0x2
  var isMasked = 0

  toWrite[ iByte ] |= fin << 7
  toWrite[ iByte ] |= rsv1 << 6
  toWrite[ iByte ] |= rsv2 << 5
  toWrite[ iByte ] |= rsv3 << 4
  toWrite[ iByte ] |= opcode << 0
  iByte++
  toWrite[ iByte ] |= isMasked << 7
  toWrite[ iByte ] |= payload7Bit << 0
  iByte++
  if( payload7Bit == 126 )
    TacSpitNetworkBytes( toWrite, iByte, 2, bytes.length )
  else if( payload7Bit == 127 )
    TacSpitNetworkBytes( toWrite, iByte, 8, bytes.length )
  iByte += payload7BitExtByteCount

  console.assert( toWriteByteCount - iByte == bytes.length )
  var iPayloadByte = 0
  while( iByte < toWriteByteCount )
    toWrite[ iByte++ ] = bytes[ iPayloadByte++ ]

  var buffer = new Buffer( toWrite )
  socket.write( buffer )
}


function TacWebsocketOnData( buffer )
{
  var socket = this
  var user = TacGetUserBySocket( socket )

  console.assert( Buffer.isBuffer( buffer ) )

  var iByte = 0
  var curByte = buffer[ iByte++ ]
  var fin = ( curByte & 0b10000000 ) >> 7
  var rsv1 = ( curByte & 0b01000000 ) >> 6
  var rsv2 = ( curByte & 0b00100000 ) >> 5
  var rsv3 = ( curByte & 0b00010000 ) >> 4
  var opcode = ( curByte & 0b00001111 ) >> 0
  curByte = buffer[ iByte++ ]
  var isMasked = ( curByte & 0b10000000 ) >> 7
  if( isMasked != 1 )
  {
    console.error( "client messages must be masked" )
    console.error( "TODO: drop connection" )
  }
  var payloadLength = ( curByte & 0b01111111 ) >> 0
  var payload7BitExtByteCount = 0
  if( payloadLength == 126 )
  {
    payload7BitExtByteCount = 2
    payloadLength = TacEatNetworkBytes( buffer, iByte, payload7BitExtByteCount )
  }
  else if( payloadLength == 127 )
  {
    payload7BitExtByteCount = 8
    payloadLength = TacEatNetworkBytes( buffer, iByte, payload7BitExtByteCount )
  }
  iByte += payload7BitExtByteCount

  // note:
  //   buffer is a Node.js Buffer
  //   buffer.buffer is the underlying ArrayBuffer object
  var masks = new Uint8Array( buffer.buffer, iByte, maskByteCount )
  iByte += maskByteCount

  var maskedPayload = new Uint8Array( payloadLength )
  for( var i = 0; i < payloadLength; ++i )
  {
    curByte = buffer[ iByte++ ]
    var mask = masks[ i % maskByteCount ]
    curByte ^= mask
    maskedPayload[ i ] = curByte
  }

  var maskedPayloadString = String.fromCharCode.apply( null, maskedPayload );

  console.log( "masked payload string: " + maskedPayloadString )

  var bufferString = buffer.toString()
  if( bufferString == MatchMessageCreateRoom )
    TacMatchMessageOnCreateRoom( user )

  if( shouldLogWebsocketData )
  {
    tac.DebugLog( "TacWebsocketOnData()" + bufferString )
  }
  if( shouldEchoWebsocketData )
  {
    // socket.write( buffer )
    // note: str.length returns the number of utf16 code units in a javascript string
    var bytes = new Uint8Array( maskedPayloadString.length )
    for( var i = 0; i < maskedPayloadString.length; ++i )
    {
      bytes[ i ] = maskedPayloadString.charCodeAt( i )
    }

    TacWebsocketSend( socket, bytes )
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
  // The Websocket Protocol - Opening Handshake
  // https://tools.ietf.org/html/rfc6455#section-1.3
  socket.on( "data", TacWebsocketOnData )
  socket.on( "close", TacWebsocketOnClose )
  socket.on( "end", TacWebsocketOnEnd )
  socket.on( "error", TacWebsocketOnError )
  socket.on( "timeout", TacWebsocketOnTimeout )

  // can the socket disconnect during this function?
  var handshakeKey = request.headers[ "sec-websocket-key" ] // example: "zw8JOb8Onj6QkGMrz+waBQ=="
  var handshakeSuffix = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
  var handshakeResult = crypto.createHash( "sha1" )
    .update(  handshakeKey + handshakeSuffix, "binary" )
    .digest( "base64" )

  
  var headers = 
  [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    "Sec-WebSocket-Accept: " + handshakeResult,


    "Sec-WebSocket-Protocol: tacbogus",
    // "Sec-WebSocket-Extensions:"
    
    //"HTTP/1.1 101 Web Socket Protocol Handshake",
    //"Upgrade: WebSocket",
    //"Connection: Upgrade",
  ]
  var text = headers.join( "\r\n" ) + "\r\n";
  text += "\r\n"
  if( shouldLogUpgrade )
  {
    tac.DebugLog( "on upgrade" )
    tac.DebugLog( "header = ", header.toString() )
    tac.DebugLog( "request.headers = ", request.headers )
    tac.DebugLog( "header handshakeKey      = ", handshakeKey )
    tac.DebugLog( "header handshakeResult 1 = ", handshakeResult )
    tac.DebugLog( "socket.write: ", text )
  }


  socket.write( text )


  var user = {}
  user.socket = socket
  user.userID = userIDCounter++
  tac.users.push( user )
}
if( !usingWS )
{
  server.on( "upgrade", TacServerOnUpgrade )
}

