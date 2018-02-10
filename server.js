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
    tac.DebugLog( "Request" )
  response.writeHead( 200, { "Content-Type": "text/plain" } );
  response.write( "Hello World" );
  response.end();
}
tac.DebugLog( "Creating Server" )
server = http.createServer( TacRequestListener )
server.listen( port )
// server = http.listen( port, TacServerOnListen )
//server = app.listen( port, TacServerOnListen )
function TacServerOnConnection( a, b, c, d )
{
  var iArg = 0
  for( var arg in arguments )
  {
    tac.DebugLog( iArg )
    iArg++
  }
}
server.on( "connection", TacServerOnConnection )

function TacServerOnUpgrade( request, socket, header )
{
  tac.DebugLog( "on upgrade" );
}
server.on( "upgrade", TacServerOnUpgrade )

