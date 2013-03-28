/**
 * TEST LIBRARY
 *
 * Prey Client
 *
 * Specific LINUX Functions and Variables
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
  return 'cat /etc/passwd | awk \'FS=":" {print $1}\' | grep ' + username;
}

/**
 * @param   {String} username
 *
 * @summary  Returns command to delete user
 */
os_utils.delete_user_command = function (username) {
  return 'userdel ' + username;
}

/**
 * @param   {String} username
 *
 * @summary  Returns information of `username`
 */
os_utils.get_user_info_command = function (username) {
  return 'id ' + username;
}

/**
 * @param   {String} username
 *
 * @summary  Returns the command to get the id of user `username`
 */
os_utils.get_test_user_id_command = function (username) {
  return 'awk -F":" \' /' + username  +'/ {print $3}\' /etc/passwd';
}

/**
 * @param   {String} username
 *
 * @summary  Returns the command to get a existing username
 *           (different from the parameter username)
 */
os_utils.get_existing_user_command = function (username) {
  var command = 'find /home -maxdepth 1 -not -path "*/\.*" '
              + '| grep -v ' + username + ' | tail -1 | cut -f3 -d "/"'

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
os_utils.create_user = function (username, execute_command, callback) {
  // Check whether the user actually exists
  var command = 'id ' + username;
  execute_command(command, got_user);

  function got_user (err, response) {
    if (err && err.message.match(/No such user/)) {
      // Create the user
      var command = 'useradd -r -M -U -G adm -s /bin/bash ' + username;
      return execute_command(command, callback);
    } else if (err) {
      return callback(err);
    } else {
      // User does exists
      return callback();
    }
  }
}

/**
 * @param   {Object}   opts
 * @param   {Callback} callback
 *
 * @summary Copy, Chown and Chmod files for the `config activate` test
 */
os_utils.install_files_for_test_config_activate = function (opts, callback) {
  var command = path.resolve(__dirname, 'config_activate_tester_nix.sh')
              + ' '
              + path.resolve(__dirname, '..', '..')
              + ' '
              + opts.directory
              + ' '
              + opts.username;

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
  var command = os_utils.get_test_user_id_command(username)
  execute_command(command, executed_id_query);

  function executed_id_query (err, response) {
    if (err) callback(err);
    id = parseInt(response.replace('\n', ''));
    var exec_path = path.resolve(directory, 'config_activate_tester_nix.js');
    spawn_command(exec_path,
                  [],
                  { cwd : directory,
                    uid : id,
                  },
                  callback);
  }
}
