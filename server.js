// This is the main script file that the server is running
//

// Treat warnings as errors
"use strict"

var express = require( "express" )
var app = express()
var port = process.env.PORT || 8081
var rootPath = "/"

function TacIsDebug()
{
  return app.get( "env" ) == "development"
}

function TacAssert( value )
{
  if( !TacIsDebug() )
    return
  console.assert( value )
}

function TacDebugLog( text )
{
  if( !TacIsDebug() )
    return
  console.log( text )
}

function TacRootHttpGetCallback( request, response )
{
  // Using over port.toString() because it always works
  var text = "Hello world, port: " + String( port )
  response.status( 200 ).send( text )
}

app.get( rootPath, TacRootHttpGetCallback )

var server = null
function TacServerListenCallback()
{
  TacAssert( port == server.address().port )
  TacDebugLog( "Listening on port: " + String( port ) )
}
server = app.listen( port, TacServerListenCallback )

