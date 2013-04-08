/**
 * TEST LIBRARY
 *
 * Prey Client
 *
 * Script to test the command `./bin/prey config activate`,
 * and check change of symlink in Windows OS
 *
 */

var assert    = require('assert'),
    path      = require('path'),
    program   = require('commander'),
    sandbox   = require('sandboxed-module'),
    helpers   = require(path.resolve(__dirname,'lib','conf','helpers'));

var my_stdout = [];

/***********
 *
 * To construct the cli_controller we need three things:
 * - A logger function
 * - A version of the common object (which we will modify a little)
 * - A callback function
 *
 **/
var log = function (msg) {
  return my_stdout.push('MSG: ' + msg);
}

// We need to modify this variable, and build the common object with
// the custom dependency `commander`.
// This is due to the `common` loading.
program.path  = path.resolve(__dirname, 'test_conf');
var common    = sandbox.require(path.resolve(__dirname,'lib','common'), {
  requires    : {
    'commander' : program
  }
});

// We want to know if the original values of `common.system.paths.config` are OK
assert(common.system.paths.config.match(/Prey/), 'Config Path should contain `Prey`');

// Hack to change the delay registry key
// See HJ's note: We really need to build _A_ big settings file
process.flag_test_prey_on = true;
// If we are OK, let's change the path for a custom one
common.system.paths.config = path.resolve(__dirname, 'test_conf');

var cb = function (err, message) {
  delete process.flag_test_prey_on;
  if (err) {
    my_stdout.push('END - ERR: ' + err.message);
    return callback(err, my_stdout);
  } else {
    my_stdout.push('END - OK');
    return callback(null, my_stdout);
  }
}

// Besides the changes we did, we need to make something with this function:
helpers.run_detached = function (gui_path, args) {
  my_stdout.push('MSG: helpers.run_detached called');
  my_stdout.push('MSG: gui_path - ' + gui_path);
  my_stdout.push('MSG: args - ' + args);
}

// Now, Create the cli object with dependency injections
var cli_controller_constructor =
  sandbox.require(
    path.resolve(__dirname, 'lib', 'conf', 'cli_controller'), {
  requires              : {
    './../common'       : common,
    './helpers'         : helpers
  }
});

// 'Construct' the cli_controller
var cli_controller = cli_controller_constructor(log, common, cb);

// Issue the command
var values = {};
cli_controller.activate(values);
