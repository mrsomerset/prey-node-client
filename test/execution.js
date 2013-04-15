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
        expected_output = '-- ARGV:  "' + test_dir
                        + '\\\\..\\\\lib\\agent\\cli.js"'
                        + '\r\n';
      } else {
        expected_output = '-- ARGV:  ' + test_dir + '/../lib/agent/cli.js\n';
      }
      response.should.equal(expected_output);
      done();
    }
  });

  it('Should exit when there is not a config file', function (done) {
    test_utils.prepare_test_execution_no_config_file_env(prepared_env);

    function prepared_env (err, response) {
      response[0].should.be.match(/No config file found. Please run bin\/prey config/);
      response[1].should.be.equal('-- EXIT with code 1');
      done();
    }
  });

  it('Should exit if there is not an API key in the config file', function (done) {
    test_utils.prepare_test_execution_no_api_key(test_dir, 'control-panel', prepared_env_executed);

    function prepared_env_executed (err, response) {
      if (err) throw err;
      var expected_output = [];
      if (os_name.match(/^win/)) {
        // TODO
      } else {
        expected_output.push('-- STDOUT: Device key not present.');
        expected_output.push('Error: No API key found. Please set up your account.');
      }
      response[0].should.equal(expected_output[0]);
      response[1].should.equal(expected_output[1]);
      done();
    }
  });

  it('D');
  it('E');
  it('F');
  it('G');

  after(function (done) {
    test_utils.delete_directory(test_dir, deleted_directory);
    function deleted_directory (err) {
      if (err) throw err;
      done();
    }
  });
});
