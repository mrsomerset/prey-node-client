/**
 * TEST
 *
 * Prey Client
 *
 * EXECUTION
 * [./bin/prey] (parameters)
 *
 */

// Module Requirements
var assert      = require('assert'),
    should      = require('should'),
    os_name     = process.platform.replace('darwin', 'mac').replace('win32', 'windows'),
    os_utils    = require('./lib/test_utils_' + os_name),
    path        = require('path'),
    test_utils  = require('./lib/test_utils');

describe('Execution of [./bin/prey]', function () {
  // Suite variables
  var test_dir = os_utils.get_test_env_directory();

  it('Should execute the agent if no parameters are given to [./bin/prey]', function (done) {
    test_utils.prepare_test_env_prey_executable(test_dir, prepared_env);

    function prepared_env (err) {
      if (err) throw err;
      var command = path.resolve(test_dir, 'prey');
      test_utils.execute_command(command, executed);
    }

    function executed (err, response) {
      if (err) throw err;
      var expected_output;
      if (os_name.match(/^win/)) {
        // TODO: Correct this
        expected_output = '-- ARGV:  /tmp/test_prey/../lib/agent/cli.js\r\n';
      } else {
        // TODO: Correct this
        expected_output = '-- ARGV:  /tmp/test_prey/../lib/agent/cli.js\n';
      }
      // The actual test
      response.should.equal(expected_output);
      done();
    }
  });

  it('B');
  it('C');
  it('D');
  it('E');
  it('F');
  it('G');
  it('H');

  after(function (done) {
    test_utils.delete_directory(test_dir, deleted_directory);
    function deleted_directory (err) {
      if (err) throw err;
      done();
    }
  });
});
