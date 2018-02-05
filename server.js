// This is the main script file that the server is running
//

// Treat warnings as errors
"use strict"

var express = require( "express" )
var app = express()
var port = null
var rootPath = "/"
function rootHttpGetCallback( request, response )
{
  // Using String() over toString() because it always works
  var text = "Hello world, port: " + String( port )
  response.status( 200 ).send( text )
}

app.get( rootPath, rootHttpGetCallback )

// if( module === require.main )
// {
  function serverListenCallback()
  {
    port = server.address().port
    console.log( "Listening on port: " + String( port ) )
  }
  var server = app.listen( process.env.PORT || 8081, serverListenCallback )
// }

module.exports = app

