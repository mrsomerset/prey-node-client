'use strict;'

var common     = require('./common'),
    loader     = require('./loader'),
    updater    = require('./updater'),
    hooks      = require('./hooks'),
    endpoints  = require('./endpoints'),
    actions    = require('./actions'),
    providers  = require('./providers'),
    reports    = require('./reports'),
    triggers   = require('./triggers'),
    exceptions = require('./exceptions');

var config     = common.config,
    logger     = common.logger.prefix('agent'),
    system     = common.system,
    program    = common.program,
    running    = false,
    started_at = null,
    running_as = null,
    drivers    = {},
    files      = []; // keep track for removal

////////////////////////////////////////////////////////////////////
// bootup
////////////////////////////////////////////////////////////////////

var is_running = function(){
  return running;
}

// returns either program.driver, program.drivers or config.get(drivers)
var get_option = function(singular) {
  var plural = singular + 's';
  return program[singular] ? [program[singular]] : program[plural] || config.get(plural);
}

var run = function(trigger) {
  if (running) return;

  // env.RUNNING_USER is user by the updater to check if it was called by the agent
  running_as = process.env.RUNNING_USER = system.get_running_user();
  started_at = new Date();

  write_header();

  updater.check(function(err, new_version){
    if (err) handle_error(err);
    if (!new_version) return engage(trigger || 'cli', {});

    hooks.trigger('event', 'client_updated', new_version)
    logger.warn('Updated to version ' + version + '! Shutting down.');
  })
}

var write_header = function(){

  var title = "\n  PREY " + common.version + " spreads its wings!";
  logger.write(title, 'light_red');
  logger.write("  Current time: " + started_at.toString(), 'bold');

  var info = "  Running under Node " +  process.version + " with PID " + process.pid;
  info += " on a " + process.arch + ' ' + common.os_name + " system as " + running_as + "\n";

  logger.write(info);
}

var engage = function(trigger, opts) {
  hooks.trigger('woken', trigger);
  if (running) return;

  load_hooks();
  load_drivers(get_option('driver'), function(err){
    if (err) return handle_error(err); // hooks.unload(); // unloaded on shutdown

    transports.set(get_option('transport'));
    triggers.watch(get_option('trigger'));

    running = true;
    logger.info('Engaged.');
  })
};

var load_driver = function(name, opts, cb) {
  loader.load_driver(name, function(err, module){
    if (err) return cb && cb(err);

    module.load(opts, function(err, driver){
      if (err) return cb && cb(err);

      driver.on('command',  perform_command);
      driver.on('commands', process_commands);
      driver.on('unload',   function() { driver_unloaded(name) });

      drivers[name] = driver;
      cb && cb(null, driver)
    })
  })
}

var load_drivers = function(list, cb){
  if (!list || !list[0])
    return cb(new Error('No drivers set!'));

  var error;
  list.forEach(function(name){
    load_driver(name, {}, function(err, driver){
      if (err) {
        handle_error(err);
        error = err;
      }
    });
  });

  var success = Object.keys(drivers).length > 0;
  cb(!success && error);
}

var load_hooks = function() {
  hooks.on('action',   endpoints.notify_action)
  hooks.on('event',    endpoints.notify_event)
  hooks.on('data',     endpoints.send_data)
  hooks.on('report',   endpoints.send_report)
  hooks.on('response', handle_response)
  hooks.on('error',    handle_error)
  hooks.on('file',     files.push)
}

var perform_command = function(command) {

  var methods = {
    'start'   : actions.start,
    'stop'    : action.stop,
    'watch'   : triggers.watch,
    'unwatch' : action.stop,
    'get'     : providers.get,
    'report'  : reports.get,
    'cancel'  : reports.cancel,
    'driver'  : load_driver
  }

  var method = methods[command.name];

  if (method)
    mappings(command.target, command.options);
  else
    handle_error(new Error('Unknown command: ' + command.toString()))
}

var process_commands = function(str) {
  try {
    var commands = JSON.parse(str);
  } catch(e) {
    return handle_error(new Error('Invalid commands: ' + str));
  }

  commands.forEach(perform_command);
}

var handle_response = function(what, endpoint, resp) {
  if (what == 'report' && resp.statusCode > 300)
    reports.cancel_all();
  else if (endpoint == 'control-panel' && resp.statusCode == 200)
    process_commands(resp.body);
}

var handle_error = function(err) {
  logger.error(err);

  if (config.get('send_crash_reports'))
    exceptions.send(err);
}

////////////////////////////////////////////////////////////////////
// shutdown
////////////////////////////////////////////////////////////////////

var disengage = function() {
  logger.info('Unloading hooks.');
  hooks.unload();

  logger.debug('Stopping actions.');
  actions.stop_all();

  logger.debug('Cancelling reports.');
  reports.cancel_all();

  logger.debug('Stopping triggers.');
  triggers.stop();

  logger.debug('Unloading drivers.');
  unload_drivers();

  logger.debug('Cleaning up files.');
  common.helpers.remove_files(files);

  running = false;
}

var unload_drivers = function() {
  for (var name in drivers) {
    drivers[name].unload(); // triggers 'unload' -> driver_unloaded
  }
}

var driver_unloaded = function(name) {
  delete drivers[name];
}

exports.run       = run;
exports.running   = is_running;
exports.engage    = engage;
exports.disengage = disengage;