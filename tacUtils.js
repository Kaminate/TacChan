"use strict"

var tac =
{
  IsDebug: null,
  Assert: null,
  DebugLog: null
}

// requires
var fs = require( "fs" )
var util = require( "util" )

// regular vars
var debugLogPath = __dirname + "/debug.txt"

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
  if( !tac.IsDebug() )
    return
  // This should be the only console.log in all tac code,
  // because the debug log also spits into a file
  var line = new Date().toString() + util.format( ...args )
  console.log( line )
  fs.appendFile( debugLogPath, line + "\n", ( err ) => {} )
}

if( tac.IsDebug() )
{
  fs.truncate( debugLogPath, ( err ) => {} )
  tac.DebugLog( "Debug Mode Activated" )
}

module.exports = tac

