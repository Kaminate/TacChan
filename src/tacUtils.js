"use strict"

var readline = require( "readline" )

var tac =
{
  IsDebug: null,
  Assert: null,
  DebugLog: null
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

