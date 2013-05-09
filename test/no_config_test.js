var resolve      = require('path').resolve,
    should       = require('should'),
    sandbox      = require('sandboxed-module'),
    agent_path   = resolve(__dirname, '..', 'lib', 'agent');

var exit_code, out, signals = [];

var fake_common  = {
      logger: { write: function(str){ out = str; } },
      config: { present: function(){ return false; } },
      system: { tempfile_path: function(file){ return file; }}
    },
    fake_process = {
      env  : process.env,
      argv : [],
      exit: function(code){ exit_code = code },
      on: function(signal, cb){ signals.push(signal) }
    }

var sandbox_opts = {
      requires: { './common': fake_common },
      globals:  { process: fake_process }
    }

describe('when config file does not exist', function(){

  before(function(){
    sandbox.require(resolve(agent_path, 'cli_controller'), sandbox_opts);
  })

  it('exits the process with status 1', function(){
    exit_code.should.equal(1);
  })

  it('does not set any signal handlers', function(){
    signals.should.be.empty;
  })

  it('logs error message', function(){
    out.toLowerCase().should.include('no config file found');
  })

})
