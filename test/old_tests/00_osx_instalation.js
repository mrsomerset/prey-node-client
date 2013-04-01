
  describe('### Controller', function () {
    // Suite variables
    var id
      , version   = require(path.resolve(__dirname, '..','package.json')).version
      , testDir   = path.resolve('/', 'test_prey', 'versions', version)
      , testPath  = '/tmp/' + testDir
      , username  = 'test___prey';




    it('Should go to `controller#show_gui_and_exit` when -g flag is called', function (done) {
      var execPath        = testPath + '/configActivateTester.js'
        , commandResponse = '';
      testUtils.spawnCommand( execPath
                              , ['-g']
                              , { uid : id
                                , cwd : testPath
                              }
                              , executedCommand);

      function executedCommand (stderr, stdout, exit) {
        if (stderr) {
          commandResponse += stderr;
        }
        if (stdout) {
          commandResponse += stdout;
        }
        if (exit) {
          // TEST
          var response = commandResponse.split('\n');
          response[response.length - 5].should.be.equal('MSG: helpers.run_detached called');
          response[response.length - 4].should.be.equal('MSG: gui_path - /usr/bin/ruby');
          assert( response[response.length - 3]
                    .match(/PreyConfig.app\/Contents\/MacOS\/prey-config.rb/) !== null
                , "Argument of gui should be PreyConfig.app/Contents/MacOS/prey-config.rb");
          response[response.length - 2].should.be.equal('MSG: Exiting...');
          done();
        }
      }
    });

    after(function (done) {
      testUtils.cleanUpTestEnvConfigActivate(username, testDir, cleanedUp);

      function cleanedUp (err) {
        if (err) throw err;
        done();
      }
    });
  });
}

function suiteConfigHooks () {
  // Suite Variables
  var launchdaemons_path = '/tmp/test_prey'
    , launchd_plist      = 'com.prey.trigger.plist'

  before(function (done) {
    var execCommand = 'rm -rf /tmp/test_prey';
    testUtils.executeCommand(execCommand, deletedDir);
    function deletedDir (err) {
      if (err) throw err;
      fs.mkdir('/tmp/test_prey', done);
    }
  });

  it('Should set up `prey-trigger.py` in launchd', function (done) {
    this.timeout(10000);
    // Test dependencies
    var system          = require('../lib/system')
      , common          = require('../lib/common')
      , hook_locals     = {
          running_user        : 'test___prey'
        , label               : 'com.test_prey.trigger'
        , launchdaemons_path  : launchdaemons_path
        , launchd_plist       : launchd_plist
        , trigger_script      : 'prey-trigger.py'
      }
      , myConsoleOutput = []
      , myConsole       = {};
    myConsole.log       = function (msg) { myConsoleOutput.push(msg); }
    var hooks           =
      sandbox.require('../lib/conf/' + common.os_name
                     ,  { requires          : {
                            './hook_locals' : hook_locals
                          }
                        , globals           : {
                            console         : myConsole
                          }
                        });

    // Do the call!
    hooks.post_install(madeHookCall);

    function madeHookCall (err) {
      if (err) throw err;
      // TEST
      // stdout
      myConsoleOutput[0].should.be.equal('Setting up launchd script...');
      myConsoleOutput[1].should.be.equal('LaunchDaemon script copied. Loading it...');
      // Does the file exists? (if not, an exception will be raised)
      var plistData = fs.readFileSync('/tmp/test_prey/' + hook_locals.launchd_plist, 'utf8');
      // Content checking
      var trigger_script_path = path.join(system.paths.current, 'bin', 'mac', 'prey-trigger.py');
      var expectedMatch = new RegExp('<string>' + trigger_script_path + '</string>');
      if(!plistData.match(expectedMatch)) throw 'Incorrect Trigger Script in .plist file';
      expectedMatch = new RegExp('<string>' + system.paths.current_bin +'</string>');
      if(!plistData.match(expectedMatch)) throw 'Incorrect Prey binary in .plist file';
      expectedMatch = /<key>UserName<\/key>\n\t<string>test___prey<\/string>/;
      if(!plistData.match(expectedMatch)) throw 'Incorrect UserName in .plist file';
      // One thing left. Did we load the line into `launchctl`?
      var execCommand = 'launchctl list';
      testUtils.executeCommand(execCommand, onQueryResponse);
    }

    function onQueryResponse (err, data) {
      if (err) throw err;
      if(!data.match(/com.test_prey.trigger/)) throw '.plist is not loaded into system'
      done();
    }
  });

  it('Should unset up `prey-trigger.py` in launchd and delete the .plist file', function (done) {
    this.timeout(10000);
    // Test dependencies
    var system          = require('../lib/system')
      , common          = require('../lib/common')
      , hook_locals     = {
          running_user        : 'test___prey'
        , label               : 'com.test_prey.trigger'
        , launchdaemons_path  : launchdaemons_path
        , launchd_plist       : launchd_plist
        , trigger_script      : 'prey-trigger.py'
      }
      , myConsoleOutput = []
      , myConsole       = {};
    myConsole.log       = function (msg) { myConsoleOutput.push(msg); }
    var hooks           =
      sandbox.require('../lib/conf/' + common.os_name
                     ,  { requires          : {
                            './hook_locals' : hook_locals
                          }
                        , globals           : {
                            console         : myConsole
                          }
                        });

    // Do the call!
    hooks.pre_uninstall(madeHookCall);

    function madeHookCall (err) {
      if (err) throw err;
      // TEST
      // stdout
      myConsoleOutput[0].should.be.equal('Removing launchd script...');
      myConsoleOutput[1].should.be.equal('Prey trigger unloaded. Removing plist...');
      // Check if the service is still loaded
      var execCommand = 'launchctl list';
      testUtils.executeCommand(execCommand, onQueryResponse);
    }

    function onQueryResponse (err, data) {
      if (err) throw err;
      if(data.match(/com.test_prey.trigger/)) throw '.plist is not loaded into system'
      // Check that the file isn't there
      try {
        var plistData = fs.readFileSync('/tmp/test_prey/' + hook_locals.launchd_plist, 'utf8');
      } catch (e) {
        e.code.should.be.equal('ENOENT');
      }
      done();
    }
  });

  after(function (done) {
    // Unload plist
    var execCommand = 'launchctl unload ' + launchdaemons_path + '/' + launchd_plist;
    testUtils.executeCommand(execCommand, unloadedPlist);

    function unloadedPlist (err) {
      if (err) {
        if(!err.toString().match(/Error: Command failed: launchctl: Couldn't stat/))
          throw err;
      }
      execCommand = 'rm -rf /tmp/test_prey';
      testUtils.executeCommand(execCommand, deletedDir);
    }

    function deletedDir (err) {
      if (err) throw err;
      done();
    }
  });
}
