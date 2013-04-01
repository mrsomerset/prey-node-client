/**
 * TEST LIBRARY
 *
 * Prey Client
 *
 * Specific OSX Functions and Variables
 *
 */

// Module requirements
var fs    = require('fs'),
    path  = require('path');

// Module constructor
var os_utils = module.exports = function () {};

/**
 * @param   {String} username
 *
 * @summary  Returns command to grep the `username`
 *           from an output of the user list
 */
os_utils.grep_user_from_list_command = function (username) {
  return 'dscl . -list /Users | grep ' + username;
}

/**
 * @param   {String} username
 *
 * @summary  Returns command to delete user
 */
os_utils.delete_user_command = function (username) {
  return 'dscl . -delete /Users/' + username;
}

/**
 * @param   {String} username
 *
 * @summary  Returns information of `username`
 */
os_utils.get_user_info_command = function (username) {
  return 'dscl . -read /Users/' + username;
}

/**
 * @param   {String} username
 *
 * @summary Returns the command to get the id of user `username`
 */
os_utils.get_test_user_id_command = function (username) {
  return 'dscl . -read /Users/' + username + ' | grep UniqueID';
}

/**
 * @param   {String} username
 *
 * @summary  Returns the command to get a existing username
 *           (different from the parameter username)
 */
os_utils.get_existing_user_command = function (username) {
  var command = 'dscl . -list /Users | '
              + 'grep -Ev "^_|daemon|nobody|root|Guest|' + username
              + '" | tail -1';
  return command;
}

/**
 * @summary  Returns the temporal directory name
 */
os_utils.get_test_env_directory = function () {
  return '/tmp/test_prey';
}

/**
 * @param   {String}    directory
 *
 * @summary  Returns the command to delete a directory
 */
os_utils.get_delete_directory_command = function (directory) {
  return 'rm -rf ' + directory;
}

/**
 * @param   {String}    directory
 * @param   {Callback}  callback
 *
 * @summary Creates a mock nodeJS executable file which just echoes
 *          its calling parameters in the designated directory
 */
os_utils.create_mock_node_exec_file = function (directory, callback) {
  var file_contents = '#!/bin/bash\necho "-- ARGV: " $@\n';
  var file_path     = directory + '/node'
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
 * @param   {String}    username
 * @param   {Function}  execute_command
 * @param   {Callback}  callback
 *
 * @summary Creates a user
 */
os_utils.create_user= function (username, execute_command, callback) {
  // Check whether this username exists
  var command = 'dscl . -read /Users/' + username
    , id;
  execute_command(command, got_user);

  function got_user (err, data) {
    // No error handler: If we got `err`, it means there
    // is no user with that handle
    if (data) {
      return callback(); // The user is already there, move on
    }
    // Get last ID in the system
    command = "dscl . -list /Users UniqueID | awk '{print $2}' | sort -ug | tail -1";
    execute_command(command, got_id);
  }

  function got_id (err, _id) {
    if (err) return callback(err);
    id = parseInt(_id) + 1;
    // Create the user
    command = "dscl . -create /Users/" + username;
    execute_command(command, created_user);
  }

  function created_user (err) {
    if (err) return callback(err);
    // Assign the id to the user
    command = "dscl . -create /Users/" + username + " UniqueID " + id;
    execute_command(command, assigned_unique_ID);
  }

  function assigned_unique_ID (err) {
    if (err) return callback(err);
    command = "dscl . -create /Users/" + username + " PrimaryGroupID 80";
    execute_command(command, assigned_primary_group_ID);
  }

  function assigned_primary_group_ID (err) {
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
  var command = path.resolve(__dirname, 'config_activate_tester_nix.sh')
              + ' '
              + path.resolve(__dirname, '..', '..')
              + ' '
              + opts.directory
              + ' '
              + opts.username;

  if (opts.test === 'new_version') command += ' new_version';

  opts.execute_command(command, callback);
}

/**
 * @param   {String}   username
 * @param   {String}   directory
 * @param   {Function} execute_command
 * @param   {Function} spawn_command
 * @param   {Callback} callback
 *
 * @summary Invoke the `config activate` encapsulated script,
 *          with all respective dependency injections.
 */
os_utils.invoke_config_activate = function (username, directory, execute_command, spawn_command, callback) {
  // We need the user id
  var id;
  var command = 'dscl . -list /Users UniqueID | grep ' + username;
  execute_command(command, executed_id_query);

  function executed_id_query (err, response) {
    if (err) callback(err);
    var response_split = response.split(' ');
    id = parseInt(response_split[response_split .length - 1].replace('\n', ''));
    var exec_path = path.resolve(directory, 'config_activate_tester_nix.js');
    spawn_command(exec_path,
                  [],
                  { cwd : directory,
                    uid : id,
                  },
                  callback);
  }
}

/**
 * @param   {String} directory
 *
 * @summary  Returns command to grep the `username`
 *           from an output of the user list
 */
os_utils.get_check_symlink_command = function (directory) {
  return "ls -al " + path.resolve(directory, 'current');
}
