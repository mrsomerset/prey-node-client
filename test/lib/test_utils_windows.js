/**
 * TEST LIBRARY
 *
 * Prey Client
 *
 * Specific WINDOWS Functions and Variables
 *
 */

// Module requirements
var fs    = require('fs'),
    path  = require('path');

// Module constructor
var os_utils = module.exports = function () {};

/**
 * @summary  Returns the temporal directory name
 */
os_utils.get_test_env_directory = function () {
  return path.resolve(process.env.TMP, 'test_prey');
}

/**
 * @param   {String}    directory
 *
 * @summary  Returns the command to delete a directory
 */
os_utils.get_delete_directory_command = function (directory) {
  return 'rmdir ' + directory + ' /s /q';
}

/**
 * @param   {String}    directory
 * @param   {Callback}  callback
 *
 * @summary Creates a mock nodeJS executable file which just echoes
 *          its calling parameters in the designated directory
 */
os_utils.create_mock_node_exec_file = function (directory, callback) {
  var file_contents = 'echo -- ARGV:  %*\n';
  var file_path     = directory + '/node.bat'
  fs.writeFile(file_path, file_contents, wrote_file);

  function wrote_file (err) {
    if (err) return callback(err);
    fs.chmod(file_path, '777', done_chmod);
  }

  function done_chmod (err) {
    if (err) return callback(err);
    return callback();
  }
}

/**
 * @param   {Object}   opts
 * @param   {Callback} callback
 *
 * @summary Copy, Chown and Chmod files for the `config activate` test
 */
os_utils.install_files_for_impersonating_tests = function (opts, callback) {
  var command = path.resolve(__dirname, 'config_activate_tester_win.cmd')
              + ' '
              + path.resolve(__dirname, '..', '..')
              + ' '
              + opts.directory;
  opts.execute_command(command, callback);
}

/**
 * @param   {Object}   objVars
 * @param   {Callback} callback
 *
 * @summary Invoke `config activate` function of [./bin/prey]
 *          by calling directly the function cli_controller#activate.
 *          Some dependency injections are needed
 */
os_utils.invoke_config_activate = function (objVars, callback) {
  // Will make the requires here, so we do not pollute the modules
  // requirements. Besides, we can get away with this synchronous operations.

  // HJ:  The structure of this function is very alike to
  //      config_activate_tester_nix.js
  //      Personally, I hope this whole test to be the most complex
  //      of this suite :)
  var assert    = require('assert'),
      program   = require('commander'),
      sandbox   = require('sandboxed-module'),
      helpers   = require(path.resolve(__dirname, '..','..','lib','conf','helpers'));

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
  program.path  = path.resolve(objVars.directory, 'test_conf');
  var common    = sandbox.require(path.resolve(__dirname, '..','..','lib','common'), {
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
  common.system.paths.config = path.resolve(objVars.directory, 'test_conf');
  // And remove the versions supports for this test
  common.system.paths.versions = null;

  var cb = function (err, message) {
    delete process.flag_test_prey_on;
    if (err) {
      my_stdout.push('END - ERR: ' + err.message);
      return callback(err, my_stdout);
    } else {
      my_stdout.push('END - OK');
      return callback(null, my_stdout)
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
      path.resolve(__dirname, '..','..', 'lib', 'conf', 'cli_controller'), {
    requires              : {
      './../common'       : common,
      './helpers'         : helpers
    }
  });

  // 'Construct' the cli_controller
  var cli_controller = cli_controller_constructor(log, common, cb);

  // Issue the command
  cli_controller.activate(objVars.values);
}

/**
 * @param {Object}    opts
 * @param {Callback}  callback
 *
 * @summary Invoke `config activate` function of [./bin/prey]
 *          by calling directly the function cli_controller#activate.
 *          Some dependency injections are needed.
 *          This test differs from function
 *          os_utils#invoke_config_activate
 */
os_utils.invoke_install_new_version = function (opts, callback) {
  var command = 'node '
              + path.resolve(opts.directory, 'config_activate_tester_win.js');
  return opts.execute_command(command, callback);
}

/**
 * @param   {String} directory
 *
 * @summary Returns command to grep the `username`
 *          from an output of the user list
 */
os_utils.get_check_symlink_command = function (directory) {
  return "dir " + path.resolve(directory, 'current');
}

/**
 * @param   {String}    key
 * @param   {Callback}  callback
 *
 * @summary Deletes the key from the registry
 */
os_utils.delete_registry_key = function (callback) {
  process.flag_test_prey_on = true;
  var delay =
    require(path.resolve(__dirname, '..','..', 'lib', 'system', 'windows', 'delay'));
  delay.unset(done_operation);
  function done_operation (err) {
    if (err) return callback(err);
    delete process.flag_test_prey_on;
    return callback();
  }
}
