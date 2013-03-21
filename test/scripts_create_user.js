/**
 * TEST
 *
 * Prey Client
 *
 * SCRIPTS
 * scripts/create_user.js
 *
 */

// Module Requirements
var assert      = require('assert'),
    fs          = require('fs'),
    path        = require('path'),
    should      = require('should'),
    test_utils  = require('./lib/test_utils');

describe('scripts/create_user.js', function () {
  // Suite Variables
  var create_user_path  = path.resolve(__dirname, '..', 'scripts', 'create_user.sh');
      test_user         = 'test___prey';

  before(function (done) {
    // Prepare the environment deleting the test user
    test_utils.delete_user(test_user, deleted_user);

    function deleted_user (err) {
      if (err) throw err;
      done();
    }
  });

  describe('#create_user()', function (done) {

    it('Should exit when no username is given', function (done) {
      test_utils.execute_command(create_user_path, executed);

      function executed (err, response) {
        err.should.be.equal('User name required.\n');
        done();
      }
    });

    it('Should create a user, given the username', function (done) {
      this.timeout(10000);
      var exec_command = create_user_path + ' ' + test_user;
      test_utils.execute_command(exec_command, executed_creation);

      function executed_creation (err, response) {
        if (err) throw err;
        // Let's test if the user was created
        exec_command = 'dscl . -read /Users/' + test_user;
        test_utils.execute_command(exec_command, executed_query);
      }

      function executed_query (err, response) {
        // If the user was not created, we will have an error
        if (err) throw err;
        // Let's check the rest of the values:
        var user_data = response.split('\n');
        assert( user_data.indexOf('UserShell: /bin/bash') !== -1,
                'UserShell should be /bin/bash');
        var index_real_name = user_data.indexOf('RealName:');
        user_data[index_real_name + 1].should.be.equal(' Prey Anti-Theft');
        assert( response.toString().indexOf('AuthenticationAuthority:') === -1,
                'AuthenticationAuthority exists!');
        assert( user_data.indexOf('PrimaryGroupID: 80') !== -1,
                'PrimaryGroupID should be 80');
        assert(user_data.indexOf('Password: *') !== -1, 'Password should be *');
        done();
      }
    });

    it('Should exit if it is executed with a user different than root', function (done) {
      this.timeout(10000);
      test_utils.get_test_user_id(test_user, got_id);

      function got_id (err, id) {
        if (err) throw err;
        test_utils.spawn_command(create_user_path,
                                [test_user],
                                {uid : id},
                                executed);
      }

      function executed (err, response) {
        if (err) throw err;
        response.should.match(/create_user.sh must be run as root/);
        done();
      }
    });

    it('Should exit if user already exists', function (done) {
      this.timeout(10000);
      var exec_command = create_user_path + ' ' + test_user;
      test_utils.execute_command(exec_command, executed_creation);

      function executed_creation (err, response) {
        response.should.be.equal(test_user + ' user already exists!\n'),
        done();
      }
    });
  });

  describe('#grant_privileges()', function (done) {
    // Variables of this suite
    var existing_username,
        sudoers_path       = '/etc/sudoers.d/50_' + test_user +'_switcher',
        test_user_id;

    it('Should find the sudoers.d file and that it has the right privileges', function (done) {
      fs.stat(sudoers_path, found_file);

      function found_file (err) {
        if (err) throw err;
        fs.readFile(sudoers_path, 'utf8', read_file);
      }

      function read_file (err, data) {
        if (err) throw err;
        data.should.be.equal(test_user
          + ' ALL = NOPASSWD: /usr/bin/su [A-z]*, !/usr/bin/su root*, !/usr/bin/su -*\n');
        done();
      }
    });

    it('Should, as <test_user>, impersonate the existing user', function (done) {
      test_utils.get_existing_user(test_user, got_user);

      function got_user (err, obj) {
        // We will invoke the test_user to impersonate an existing user
        // which in turn, will issue a `whoami`.
        // In a normal CLI, to test, you would do (as root)
        // $ sudo su <test_user> -c "sudo su <existing_user> -c 'whoami'"
        existing_username = obj.existing_username;
        test_user_id      = obj.test_user_id;
        test_utils.spawn_command(
          'sudo',
          ['-n', 'su', existing_username, '-c', 'whoami'],
          { uid : test_user_id },
          executed
        );
      }

      function executed (err, response) {
        if (err) throw err;
        response.should.be.equal(existing_username + '\n');
        done();
      }
    });

    it('Should, as <test_user>, be unable to impersonate if the sudoers file doesn\'t exist', function (done) {
      fs.unlink(sudoers_path, deleted_file);

      function deleted_file (err) {
        if (err) throw err;
        // Try to impersonate
        test_utils.spawn_command(
          'sudo',
          ['-kn', 'su', existing_username, '-c', 'whoami'],
          { uid : test_user_id },
          executed
        );
      }

      function executed (err, response) {
        console.log(arguments)
        done()
      }
    });
  });

  after(function (done) {
    // Delete the test user
    test_utils.delete_user(test_user, deleted_user);

    function deleted_user (err) {
      if (err) throw err;
      // And delete the sudoers.d file
      test_utils.delete_sudoers_file(test_user, deleted_file);
    }

    function deleted_file (err) {
      if (err) throw err;
      done();
    }
  });
});