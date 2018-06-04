// This file is include by both client & server code, so it can't include node stuff

"use strict"

var tac =
{
  IsDebug: null,
  Assert: null,
  DebugLog: null
}

tac.ClearConsole = function()
{
  // https://stackoverflow.com/questions/9006988/node-js-on-windows-how-to-clear-console
  // TODO: cross platform?
  // TODO: how does this work?
  // TODO: does this work?
  console.log( "\u001b[2J\u001b[0;0H" )
}

tac.IsDebug = function()
{
  // as opposed to production
  // If using express, this is app.get( "env" ) == "development"
  return !process.env.NODE_ENV || process.env.NODE_ENV == "development"
}

tac.isLittleEndian = new Uint8Array( new Uint32Array( [ 0x12345678 ] ).buffer )[ 0 ] == 0x78

tac.Assert = function( value )
{
  if( !tac.IsDebug() )
    return
  console.assert( value )
}

tac.DebugLog = function( ...args )
{
  function Pad( number )
  {
    if( number < 10 )
      return "0" + number
    return number
  }

  if( !tac.IsDebug() )
    return
  var now = new Date()
  var line =
    // ISO 8601
    new Date().toISOString() + " "
  for( var arg of args )
  {
    var argString = ""
    if( typeof arg == "object" )
      argString = JSON.stringify( arg, null, "\t" )
    else
      argString = String( arg )
    line += argString + " "
  }

  console.log( line )

  if( tac.DebugLogPost )
  {
    tac.DebugLogPost( line )
  }
}

module.exports = tac

