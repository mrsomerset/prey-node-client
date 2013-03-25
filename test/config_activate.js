/**
 * TEST
 *
 * Prey Client
 *
 * CONFIGURATION
 * [./bin/prey] config activate
 *
 */

// Module Requirements
var should      = require('should'),
    os_name     = process.platform.replace('darwin', 'mac').replace('win32', 'windows'),
    os_utils    = require('./lib/test_utils_' + os_name),
    path        = require('path'),
    test_utils  = require('./lib/test_utils');

describe('[./bin/prey] config activate', function () {
  // Suite variables
  var my_std_out_messages = new Array();
  var my_log = function (msg) {
    my_std_out_messages.push(msg);
  }
  var test_dir = os_utils.get_test_env_directory();

  it('Should load `lib/conf/cli.js` on `config activate` command', function (done) {
    test_utils.prepare_test_env_prey_executable(test_dir, prepared_env);

    function prepared_env (err) {
      if (err) throw err;
      var command = path.resolve(test_dir, 'prey') + ' config activate';
      test_utils.execute_command(command, executed);
    }

    function executed (err, response) {
      if (err) throw err;
      var expected_output;
      if (os_name.match(/^win/)) {
        expected_output = '-- ARGV:  "' + test_dir
                        + '\\\\..\\\\lib\\conf\\cli.js"'
                        + ' config activate'
                        + '\r\n';
      } else {
        expected_output = '-- ARGV:  ' + test_dir
                        + '/../lib/conf/cli.js'
                        + ' config activate'
                        + '\n';
      }
      // The actual test
      response.should.equal(expected_output);
      done();
    }
  });

  it('Should not do anything if `process.env.BUNDLE_ONLY is on`', function (done) {
    // Key variable
    process.env.BUNDLE_ONLY = true;
    // Require the controller and call the function
    var common         = require('../lib/common');
    var cli_controller =
      require('../lib/conf/cli_controller')(my_log, common, on_activate_called);
    cli_controller.activate();

    function on_activate_called (err, msg) {
      if (err) my_std_out_messages.push('ERR: ' + err.message);
      if (msg) my_std_out_messages.push('MSG: ' + msg);
      if (arguments.length === 0) my_std_out_messages.push('OK');
      // The test
      my_std_out_messages.should.have.length(1);
      my_std_out_messages[0].should.be.equal('OK');
      // Are we done yet? Let's clean the variable
      delete process.env.BUNDLE_ONLY;
      done();
    }
  });

  it('Should setup version and interval on `controller#activate` call`');
  it('Should `install` a new version, and update the system');
  it('Should go to `controller#show_gui_and_exit` when -g flag is called');

  after(function (done) {
    // Cleanup, Just in case
    test_utils.delete_directory(test_dir, deleted);

    function deleted (err) {
      if (err) throw err;
      done();
    }
  })
});