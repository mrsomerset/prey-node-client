#!/usr/bin/env node

/**
 * TEST LIBRARY
 *
 * Prey Client
 *
 * Script to test the command `./bin/prey config activate`
 * Should be run as the `prey user`
 *
 */

// Modules and Dependencies to be injected
var assert  = require('assert'),
    os_name = process.platform.replace('darwin', 'mac').replace('win32', 'windows'),
    path    = require('path'),
    program = require('commander'),
    sandbox = require('sandboxed-module'),
    helpers = require('./lib/conf/helpers');

/***********
 *
 * To construct the cli_controller we need three things:
 * - A logger function
 * - A version of the common object (which we will modify a little)
 * - A callback function
 * 
 **/
var log = function (msg) {
  return console.log('MSG: ' + msg);
}

// We need to modify this variable, and build the common object with
// the custom dependency `commander`.
program.path  = path.resolve(__dirname, 'test_conf');
var common    = sandbox.require('./lib/common', {
  requires    : {
    'commander' : program
  }
});

// We want to know if the original values of `common.system.paths.config` are OK
assert(common.system.paths.config === '/etc/prey', 'Config Path should be `/etc/prey`');

// If we are OK, let's change the path for a custom one
common.system.paths.config = path.resolve(__dirname, 'test_conf');

var callback = function (err, message) {
  if (err) {
    return console.log('END - ERR: ' + err.message);
  }
  return console.log('END - OK');
}

// Besides the changes we did, we need to make something with this function:
helpers.run_detached = function (gui_path, args) {
  console.log('MSG: helpers.run_detached called');
  console.log('MSG: gui_path - ' + gui_path);
  console.log('MSG: args - ' + args);
}

// Now, Create the cli object with dependency injections
var cli_controller_constructor = sandbox.require('./lib/conf/cli_controller', {
  requires              : {
    './../common'       : common,
    './helpers'         : helpers
  }
});

// 'Construct' the cli_controller
var cli_controller = cli_controller_constructor(log, common, callback);

// Issue the command
//    Do we have the `-g` parameter?
var activateValues = {};
if (process.argv.length > 2 && process.argv[2] === '-g')
  activateValues = { '-g' : true }

cli_controller.activate(activateValues);
