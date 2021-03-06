
//////////////////////////////////////////
// Prey Node.js Client
// Written by Tomás Pollak
// (c) 2012, Fork Ltd. - http://forkhq.com
// Licensed under the GPLv3
//////////////////////////////////////////

"use strict";

var join        = require('path').join,
    root_path   = process.env.ROOT_PATH || join(__dirname, '..', '..'),
    version     = require(join(root_path, 'package')).version,
    is_windows  = process.platform === 'win32',
    program     = require('commander');

/////////////////////////////////////////////////////////////
// command line options
/////////////////////////////////////////////////////////////

program
   .version(version)
   .option('-p, --path <path>', 'Path to config file [/etc/prey or C:\\$WINDIR\\Prey]')
   .option('-d, --driver <driver>', 'Driver to use for fetching instructions')
   .option('-r, --run <command>', 'Run arbitrary command (eg. "get coordinates")')
   .option('-s, --skip-connection-check', 'Do not check for network connection.')
   .option('-l, --logfile <logfile>', 'Logfile to use')
   .option('-D, --debug', 'Output debugging info')
   .option('-N, --node-version', 'Prints node version in use.')
   .parse(process.argv);

var common   = require('./common'),
    agent    = require('./'),
    pid      = require(join('..', 'utils', 'pidfile')),
    pid_file = common.system.tempfile_path('prey.pid'),
    logger   = common.logger;

if (program.nodeVersion) {
  return logger.write(process.version);
} else if (!common.config.present()) {
  logger.write('\nNo config file found. Please run bin/prey config.\n');
  return process.exit(1);
}

/////////////////////////////////////////////////////////////
// event, signal handlers
/////////////////////////////////////////////////////////////

process.on('exit', function(code) {
  if (agent.running()) {
    agent.shutdown(); // sets agent.running = false
    pid.remove(pid_file);
    logger.info('Have a jolly good day sir.\n');
  }
});

process.on('SIGQUIT', function() {
  logger.warn('Gracefully shutting down.');
  process.exit(0);
});

process.on('SIGINT', function() {
  logger.warn('Got Ctrl-C!');
  process.exit(1);
});

process.on('SIGTERM', function() {
  logger.warn('Evil forces tried to kill us!');
});

process.on('SIGUSR1', function() {
  logger.warn('Got SIGUSR1 signal!');
  agent.engage('interval');
});

process.on('SIGUSR2', function() {
  logger.warn('Got SIGUSR2 signal!');
  agent.engage('network');
});

process.on('uncaughtException', function (err) {
  logger.critical('UNCAUGHT EXCEPTION: ' + err.message);
  logger.debug(err.stack);

  if (common.config.get('send_crash_reports'))
    require('./exceptions').send(err);

  process.exit(1);
});

////////////////////////////////////////////////////////////
// launcher
/////////////////////////////////////////////////////////////

pid.store(pid_file, function(err, running){
  if (err) throw(err);
  if (!running) return agent.run();

  var run_time = (new Date() - running.stat.ctime)/(60 * 1000);

  if (process.stdout._type == 'tty') {
    var run_time_str = run_time.toString().substring(0,5);
    logger.write('\nLive instance for ' + run_time_str + ' minutes with PID: ' +  running.pid + '.');
  }

  // don't poke instance if running since less than two minutes ago
  if (run_time < 2) return process.exit(0);

  if (!is_windows) {
    var signal = process.env.TRIGGER ? 'SIGUSR2' : 'SIGUSR1';
    process.kill(running.pid, signal);
  }

  process.exit(10);
});
