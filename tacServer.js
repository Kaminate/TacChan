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



function TacFrameParser()
{
  this.readByteCount = 0
  this.readBitCount = 0
  this.buffer = null
  this.isLittleEndian = new Uint8Array( new Uint32Array( [ 0x12345678 ] ).buffer )[ 0 ] == 0x78
}
TacFrameParser.prototype.EatNetworkBytes = function ( byteCount )
{
  console.assert( this.readBitCount == 0 )
  var result = 0
  var shiftSign = this.isLittleEndian ? -1 : 1;
  var shiftBits = this.isLittleEndian ? 0 : ( byteCount - 1 ) * 8;
  for( var i = 0; i < byteCount; ++i )
  {
    var subResult = this.buffer[ this.readByteCount + i ]
    result += subResult << shiftBits
    shiftBits += shiftSign * 8
  }
  this.readByteCount += byteCount
  return result
}
TacFrameParser.prototype.EatBits = function ( bitCount )
{
  var result = 0
  var remainingBitCount = bitCount

  while( remainingBitCount > 0 )
  {
    var bitsCanReadCount = 8 - this.readBitCount
    var bitsToReadCount = Math.min( bitsCanReadCount, remainingBitCount )

    // grab the whole byte
    var subResult = this.buffer[ this.readByteCount ]

    // shift the bits we want to the front
    subResult >>= 8 - ( this.readBitCount + bitsToReadCount )

    // mask off the remainder, which includes bits we've already read
    subResult &= ( 1 << bitsToReadCount ) - 1

    // make room for our bits in the result
    result <<= bitsToReadCount

    // add our bits to the result
    result |= subResult

    // housekeeping
    remainingBitCount -= bitsToReadCount
    this.readBitCount += bitsToReadCount
    if( this.readBitCount == 8 )
    {
      this.readBitCount = 0
      this.readByteCount++
    }
  }

  return result
}
/*
TacFrameParser.prototype.EatBit = function ()
{
  var result = 0
  result += this.buffer[ this.readByteCount ]
  result &= ( 1 << this.readBitCount ) + 1
  result >>= this.readBitCount
  this.readBitCount++
  if( this.readBitCount == 8 )
  {
    this.readBitCount = 0
    this.readByteCount++
  }
  return result
}
*/

function TacWebsocketOnData( buffer )
{
  var socket = this
  var user = TacGetUserBySocket( socket )


  console.assert( Buffer.isBuffer( buffer ) )

  var frameParser = new TacFrameParser
  frameParser.buffer = buffer

  var fin = frameParser.EatBits( 1 )
  var rsv1 = frameParser.EatBits( 1 )
  var rsv2 = frameParser.EatBits( 1 )
  var rsv3 = frameParser.EatBits( 1 )
  var opcode = frameParser.EatBits( 4 )
  var mask = frameParser.EatBits( 1 )
  if( mask != 1 )
  {
    console.error( "client messages must be masked" )
    console.error( "TODO: drop connection" )
  }
  var payloadLength = frameParser.EatBits( 7 )
  if( payloadLength == 127 )
  {
    console.error( "i dont want a payload that big" )
    console.error( "TODO: drop connection" )
  }
  if( payloadLength == 126 )
  {
    payloadLength = frameParser.EatNetworkBytes( 2 )
  }

  // this should stay in big endian, right?

  // buffer is a Node.js Buffer
  // buffer.buffer is the underlying ArrayBuffer object
  var masks = new Uint8Array( buffer.buffer, frameParser.readByteCount, 4 )
  frameParser.readByteCount += 4

  // maskKey = frameParser.EatNetworkBytes( 4 )

  var maskedPayload = new Uint8Array( payloadLength )
  for( var i = 0; i < payloadLength; ++i )
  {
    var octet = buffer[ frameParser.readByteCount ]
    var mask = masks[ i % 4 ]
    octet ^= mask
    maskedPayload[ i ] = octet
    frameParser.readByteCount++
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

