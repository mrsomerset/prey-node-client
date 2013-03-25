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
