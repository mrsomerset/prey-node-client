/**
 * TEST LIBRARY
 *
 * Prey Client
 *
 * Generic Functions
 *
 */

// Module requirements
var assert        = require('assert'),
    exec_process  = require('child_process').exec,
    fs            = require('fs'),
    spawn_process = require('child_process').spawn,
    os_name       = process.platform.replace('darwin', 'mac').replace('win32', 'windows'),
    os_utils      = require('./test_utils_' + os_name),
    path          = require('path'),
    sandbox       = require('sandboxed-module');

// Module constructor
var utils = module.exports = function () {};

/**
 * @param   {String}    command
 * @param   {Callback}  callback
 *
 * @summary Encapsulates and executes a command
 */
utils.execute_command = function (command, callback) {
  exec_process(command, executed);

  function executed (error, stdout, stderr) {
    if (error !== null) {
      if (stdout) return callback(stdout);
      return callback(error);
    }
    if (stderr !== '') return callback(stderr);
    return callback(null, stdout);
  }
}

/**
 * @param   {String}    command
 * @param   {Array}     args
 * @param   {Object}    options
 * @param   {Callback}  callback
 *
 * @summary Encapsulates and executes a command using child_process#spawn
 */
utils.spawn_command = function (command, args, options, callback) {
  try {
    var cmd       = spawn_process(command, args, options),
        error     = '',
        response  = '';

    cmd.stdout.on('data', function (data) {
      response += data.toString('utf8');
    });

    cmd.stderr.on('data', function (data) {
      error += data.toString('utf8');
    });

    cmd.on('exit', function (code) {
      if (error !== '') return callback(error);
      return callback(null, response);
    });
  } catch (e) {
    return callback(e);
  }
}

/**
 * @param   {String}    username
 * @param   {Callback}  callback
 *
 * @summary Deletes a user from the system
 */
utils.delete_user = function (username, callback) {
  // Check if user exists
  var command = os_utils.grep_user_from_list_command(username);
  utils.execute_command(command, executed_query);

  function executed_query (err, data) {
    if (data) {
      // user exists
      command = os_utils.delete_user_command(username);
      return utils.execute_command(command, callback);
    } else {
      // user doesn't exist
      return callback();
    }
  }

}

/**
 * @param   {String}    username
 * @param   {Callback}  callback
 *
 * @summary Deletes the sudoers.d file of username
 */
utils.delete_sudoers_file = function (username, callback) {
  var command = 'rm /etc/sudoers.d/50_' + username + '_switcher';
  utils.execute_command(command, executed);

  function executed (err) {
    return callback();
  }
}

/**
 * @param   {String}    username
 * @param   {Callback}  callback
 *
 * @summary Gets the id of an user by username
 */
utils.get_test_user_id = function (username, callback) {
  var command = os_utils.get_test_user_id_command(username);
  utils.execute_command(command, executed);

  function executed (err, data) {
    if (err) return callback(err);
    switch(os_name) {
      case ('mac'):
        return callback(null, parseInt(data.split(' ')[1].replace('\n', '')));
        break;
      case ('linux'):
        return callback(null, parseInt(data.replace('\n', '')));
        break;
    }
  }
}

/**
 * @param   {String}    username
 * @param   {Callback}  callback
 *
 * @summary Gets the username of a user different from the test user.
 */
utils.get_existing_user = function (username, callback) {
  var test_user_id;

  utils.get_test_user_id(username, got_id);

  function got_id (err, id) {
    if (err) return callback(err);
    test_user_id = id;
    var command = os_utils.get_existing_user_command(username);
    utils.execute_command(command, executed);
  }

  function executed (err, data) {
    if (err) return callback(err);
    return callback(null, {
      id                : test_user_id,
      existing_username : data.replace('\n', '')
    });
  }
}

/**
 * @param   {String}    username
 * @param   {Callback}  callback
 *
 * @summary  Returns the expected sudo line for `username`
 */
utils.get_expected_sudo_line = function (username, callback) {
  var command = 'which su',
      sudo_args;
  utils.execute_command(command, executed_which_su);

  function executed_which_su (err, response) {
    if (err) return callback(err);
    var which_su   = response.replace('\n', '');
    sudo_args      = which_su +' [A-z]*, !'
                   + which_su +' root*, !' + which_su +' -*\n';
    // If we are in linux, we need to check for dmidecode and iwlist
    if (os_name === 'linux') {
      command = 'which dmidecode';
      return utils.execute_command(command, executed_which_dmidecode);
    } else {
      return sendResponse(sudo_args);
    }
  }

  function executed_which_dmidecode (err, response) {
    if (response) {
      sudo_args = response.replace('\n', '') + ', ' + sudo_args;
    }
    command = 'which iwlist';
    utils.execute_command(command, executed_which_iwlist);
  }

  function executed_which_iwlist (err, response) {
    if (response) {
      sudo_args = response.replace('\n', '') + ', ' + sudo_args;
    }
    return sendResponse(sudo_args);
  }

  function sendResponse (sudo_args) {
    var line = username + ' ALL = NOPASSWD: ' + sudo_args;
    return callback(null, line);
  }
}

/**
 * @param   {String}    directory
 * @param   {Callback}  callback
 *
 * @summary  Deletes, if exists, the directory given
 */
utils.delete_directory = function (directory, callback) {
  // "Foolproof" check :P
    if ((os_name === 'linux' || os_name === 'mac') && !directory.match('^/tmp'))
    return callback(new Error('Forbidden directory to delete!'));
  if (  os_name.match(/^win/)
     && !directory.match(new RegExp('^' + process.env.TMP.replace(/\\/g,'\\\\'))))
    return callback(new Error('Forbidden directory to delete!'));

  var command = os_utils.get_delete_directory_command(directory);
  utils.execute_command(command, executed);

  function executed (err) {
    if (err) {
      if (  os_name.match(/^win/)
         && !err.message.match(/The system cannot find the file specified/))
        return callback(err);
    }
    return callback();
  }
}

/**
 * @param   {String}    directory
 * @param   {Callback}  callback
 *
 * @summary Creates a temporary test environment where a
 *          mock executable prey runs
 */
utils.prepare_test_env_prey_executable = function (directory, callback) {
  utils.delete_directory(directory, deleted_dir);

  function deleted_dir (err) {
    if (err) return callback(err);
    fs.mkdir(directory, created_dir);
  }

  function created_dir (err) {
    if (err) return callback(err);
    os_utils.create_mock_node_exec_file(directory, created_mock_file);
  }

  function created_mock_file (err) {
    if (err) return callback(err);
    // Let's copy the ./bin/prey executable into the temp directory
    var file_name = (os_name.match(/^win/))? 'prey.cmd' : 'prey'
    var src_file = path.resolve(__dirname, '..', '..', 'bin', file_name);
    var dst_file = path.resolve(directory, file_name);
    try {
      var contents = fs.readFileSync(src_file, 'utf8');
      // A small fix (so we don't have to compile an .exe)
      if (os_name.match(/^win/)) contents = contents.replace(/node.exe/g, 'node.bat');
      fs.writeFileSync(dst_file, contents);
      if (os_name === 'linux' || os_name === 'mac') {
        fs.chmodSync(dst_file, '755');
      }
      return callback();
    } catch (e) {
      return callback(e);
    }
  }
}

/**
 * @param   {String}    username
 * @param   {String}    directory
 * @param   {Callback}  callback
 *
 * @summary Creates a temporary test environment to test `config activate`
 */
utils.prepare_test_config_activate_env = function (username, directory, callback) {
  os_utils.create_user(username, utils.execute_command, created_user);

  function created_user (err) {
    if (err) return callback(err);
    // Execute `.sh` file
    var opts = {
      username        : username,
      directory       : directory,
      execute_command : utils.execute_command
    }
    os_utils.install_files_for_impersonating_tests(opts, callback);
  }
}

/**
 * @param   {String}    username
 * @param   {String}    directory
 * @param   {Callback}  callback
 *
 * @summary Creates a temporary test environment to test
 *          the installing of a new version
 */
utils.prepare_test_install_new_version_env = function (username, directory, callback) {
  // We will need the version number, and then increase it by 0.0.1
  var package_json      = require(path.resolve(__dirname, '..', '..', 'package.json'));
  var current_version   = package_json.version.split('.');
  current_version[2]    = parseInt(current_version[2]) + 1;
  var new_version       = current_version.join('.');
  var new_version_path  = path.resolve(directory, 'versions', new_version);

  if (os_name === 'mac' || os_name === 'linux') {
    os_utils.create_user(username, utils.execute_command, created_user);
  } else {
    // Windows doesn't need to create a user
    created_user();
  }

  function created_user (err) {
    if (err) return callback(err);
    // Execute `.sh` file
    var opts = {
      username        : username,
      directory       : new_version_path,
      execute_command : utils.execute_command,
      test            : 'new_version'
    }
    return os_utils.install_files_for_impersonating_tests(opts, installed_files);
  }

  function installed_files (err) {
    if (err) return callback(err);
    // We need to change the version of the package.json
    // for the test to have sense
    package_json.version = new_version;
    var package_json_path = path.resolve(new_version_path, 'package.json');
    fs.writeFile(package_json_path, JSON.stringify(package_json, null, 4), wrote_file);
  }

  function wrote_file (err) {
    if (err) return callback(err);
    return callback(null, new_version_path);
  }
}

/**
 * @param   {String}    username
 * @param   {String}    directory
 * @param   {Callback}  callback
 *
 * @summary Invoke the test for `config activate`.
 *          Impersonates in LINUX / OSX System
 */
utils.invoke_config_activate_executable = function (username, directory, callback) {
  if (os_name === 'mac' || os_name === 'linux') {
    return os_utils.invoke_config_activate( username,
                                            directory,
                                            utils.execute_command,
                                            utils.spawn_command,
                                            callback);
  } else if (os_name.match(/^win/)) {
    var objVars = {
      directory : directory,
      values    : {}
    }
    return os_utils.invoke_config_activate(objVars, callback);
  }
}

/**
 * @param   {String}   directory
 * @param   {Callback} callback
 *
 * @summary For Windows OS.
 *          Invoke `config activate` function of [./bin/prey]
 *          by calling directly the function cli_controller#activate.
 *          Some dependency injections are needed.
 *          This test differs from function
 *          os_utils#invoke_config_activate
 */
utils.invoke_install_new_version = function (directory, callback) {
  var opts = {
    directory       : directory,
    execute_command : utils.execute_command
  }
  return os_utils.invoke_install_new_version(opts, callback);
}

/**
 * @param   {String}    directory
 *
 * @summary Gets in a synchronic way the contents of a file
 */
utils.get_config_file_contents_sync = function (path) {
  try {
    var contents = fs.readFileSync(path, 'utf8');
    return contents;
  } catch (e) {
    return null;
  }
}

/**
 * @param   {String}    username
 * @param   {Callback}  callback
 *
 * @summary Get interval information
 */
utils.get_interval_data = function (username, directory, callback) {
  if (os_name === 'mac' || os_name === 'linux') {
    utils.get_test_user_id(username, function (err, id) {
      if (err) return callback(err);
      utils.spawn_command('crontab', ['-l'],
                          { cwd : directory , uid : id },
                          callback);
    });
  } else if (os_name.match(/win/)){
    var delay =
      require(
        path.resolve(__dirname, '..', '..', 'lib', 'system', 'windows', 'delay')
      );
    // Our hack to set/get the right key...
    process.flag_test_prey_on = true;
    delay.get(function (obj) {
      if (arguments.length === 0) return callback(new Error('Empty response from delay#get'));
      // ...
      delete process.flag_test_prey_on;
      return callback(null, obj);
    });
  }
}

/**
 * @param   {String}    directory
 * @param   {Callback}  callback
 *
 * @summary Executes a command to test the existence of a symlink
 */
utils.check_symlink = function (directory, callback) {
  var command = os_utils.get_check_symlink_command (directory);
  utils.execute_command(command, callback);
}

/**
 * @param   {Callback}  callback
 *
 * @summary Creates a temporary test environment to test
 *          what happens when there is no config file
 */
utils.prepare_test_execution_no_config_file_env = function (callback) {
  // The purpose here is to fake a bad location for the config file
  // HJ: This is a party of dependency injection !!!
  // TODO: Really, we will need to decouple this baby.
  var my_stdout     = [];
  var my_process    = {};
  my_process.argv   = process.argv;
  my_process.env    = process.env;
  my_process.on     = process.on;
  my_process.exit   = function (code) { my_stdout.push('-- EXIT with code ' + code);}
  var logger        = {};
  logger.write      = function (msg) { my_stdout.push('-- STDOUT: ' + msg);}
  logger.info       = logger.write;
  var logger_fact   = {}
  logger_fact.init  = function () { return logger;}
  var program       = require('commander');
  var random_string = require('crypto').createHash('md5')
                        .update(Math.random().toString()).digest('hex');
  program.path      = path.resolve('/', 'tmp', random_string);
  var common_prime  = sandbox.require(path.resolve(__dirname, '..', '..', 'lib', 'common'), {
    requires : {
      'commander' : program
    }
  });
  var common        = sandbox.require(path.resolve(__dirname, '..', '..', 'lib', 'agent','common'), {
    requires : {
      './../common' : common_prime,
      './logger'    : logger_fact
    }
  });
  var agent          = sandbox.require(path.resolve(__dirname, '..', '..', 'lib', 'agent', 'index'), {
    requires : {
      './common' : common
    }
  });
  // Some handy hack...
  my_process.flag_test_execution_no_config_file_env = true;
  var cli            = sandbox.require(path.resolve(__dirname, '..', '..', 'lib', 'agent', 'cli_controller'), {
    requires : {
      './common' : common,
      './'       : agent
    },
    globals : {
      process : my_process
    }
  });
  // END, return the stdout (let's keep the 1st param in a callback an error)
  callback(null, my_stdout);
}

/**
 * @param   {String}    directory
 * @param   {String}    driver
 * @param   {Callback}  callback
 *
 * @summary Creates a temporary test environment to test
 *          what happens when there is no api key in the config file.
 *          Aditionally, it will check if the default file has
 *          the right driver.
 */
utils.prepare_test_execution_no_api_key = function (directory, driver, callback) {
  utils.delete_directory(directory, deleted_dir);

  function deleted_dir (err) {
    if (err) return callback(err);
    fs.mkdir(directory, created_dir);
  }

  function created_dir (err) {
    if (err) return callback(err);
    fs.readFile(path.resolve(__dirname, '..', '..', 'prey.conf.default'), 'utf8', read_file);
  }

  function read_file (err, data) {
    if (err) return callback(err);
    // We want to check if this line is correct
    assert(data.match(new RegExp('driver = ' + driver)),
            'Should point the right driver: ' + driver);
    var config_path = path.resolve(directory, 'prey.conf');
    fs.writeFile(config_path, data, wrote_file);
  }

  function wrote_file (err) {
    if (err) return callback(err);
    // TODO: Really, we will need to decouple this baby.
    //       (I'm being insistent in the particular subject)
    var my_stdout     = [];

    var logger        = {};
    logger.write      = function (msg) { my_stdout.push('-- STDOUT: ' + msg);}
    logger.info       = logger.write;
    logger.warn       = logger.write;
    logger.notice     = logger.write;
    var logger_fact   = {}
    logger_fact.init  = function () { return logger;}

    var program       = require('commander');
    program.path      = directory;

    var common_prime  =
      sandbox.require(path.resolve(__dirname, '..', '..', 'lib', 'common'), {
      requires : {
        'commander'               : program
      }
    });
    var common        =
      sandbox.require(path.resolve(__dirname, '..', '..', 'lib', 'agent','common'), {
        requires : {
          './../common'           : common_prime,
          './logger'              : logger_fact
        }
    });
    var dispatcher    =
      sandbox.require(path.resolve(__dirname, '..', '..', 'lib', 'agent', 'dispatcher'), {
        requires : {
          './common'              : common
        }
    });
    var hooks         =
      sandbox.require(path.resolve(__dirname, '..', '..', 'lib', 'agent', 'hooks'), {
        requires : {
          './common'              : common
        }
    });
    var request       =
      sandbox.require(
        path.resolve(
          __dirname, '..', '..', 'lib', 'agent', 'drivers', 'control-panel', 'request'), {
          requires : {
            './../../common'      : common
          }
    });
    var control_panel =
      sandbox.require(
        path.resolve(
          __dirname, '..', '..', 'lib', 'agent', 'drivers', 'control-panel'), {
          requires : {
            './../../common'      : common,
            './../../dispatcher'  : dispatcher,
            './../../hooks'       : hooks,
            './request'           : request
          }
        });

    control_panel.load({}, loaded_panel);

    function loaded_panel (err) {
      if (err) {
        if (err.message.match('No API key found. Please set up your account.')) {
          my_stdout.push('Error: ' + err.message);
          return callback(null, my_stdout);
        } else {
          return callback(err);
        }
      }
      return callback(null, my_stdout);
    }
  }
}

/**
 * @param   {Callback}  callback
 *
 * @summary Creates a temporary test environment to know
 *          what happens when there is no internet connection.
 *          Aditionally, it will check if the default file has
 *          the right driver.
 */
utils.prepare_test_no_internet_connection = function (callback) {
  // We need this global for the test
  process.flag_test_no_internet_connection = true;

  var my_stdout     = [];
  var my_process    = {};
  my_process.argv   = process.argv;
  my_process.env    = process.env;
  my_process.on     = process.on;
  my_process.exit   = function (code) { my_stdout.push('-- EXIT with code ' + code);}

  var logger        = {};
  logger.write      = function (msg) { my_stdout.push('-- STDOUT: ' + msg);}
  logger.info       = logger.write;
  logger.debug      = logger.write;
  logger.error      = logger.write;
  logger.notice     = logger.write;
  var logger_fact   = {}
  logger_fact.init  = function () { return logger;}

  var my_conn       = {};
  my_conn.check     = function (opts, cb) { cb(new Error('TEST: No connection condition'));}

  var common        = sandbox.require(path.resolve(__dirname, '..', '..', 'lib', 'agent','common'), {
    requires : {
      './logger'    : logger_fact
    }
  });
  var hooks         = {};
  hooks.trigger     = function () {} // This is `sort` a `> dev/null`
  var agent         = sandbox.require(path.resolve(__dirname, '..', '..', 'lib', 'agent', 'index'), {
    requires : {
      './common'    : common,
      './connection': my_conn,
      './hooks'     : hooks
    }
  });

  // Call the method
  agent.check_connection(1, checked);

  function checked (err) {
    // Delete this hack
    delete process.flag_test_no_internet_connection;
    // END, return the stdout (let's keep the 1st param in a callback an error)
    callback(null, my_stdout);
  }
}
