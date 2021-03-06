"use strict";

var common      = require('./../common'),
    inspect     = require('util').inspect,
    config      = common.config,
    user_agent  = common.user_agent,
    http_client = require('needle');

var base_opts = { user_agent: user_agent };

var get_root = function(){
  var host = config.get('host');
  return host && config.get('protocol') + '://' + host + '/api/v2';
}

var log = function(str){
  console.log(str);
}

exports.authorize = function(args, cb){
  log('Authenticating...');

  var root = get_root();
  if (!root) return cb(new Error('Control Panel host not set!'));

  var url = root + '/profile.xml',
      opts = base_opts;

  // opts.parse = false;
  opts.username = args.email || args.api_key;
  opts.password = args.password || 'x';

  http_client.get(url, opts, function(err, resp, body){
    if (err) return cb(err);

    if (resp.statusCode !== 200) {
      cb(new Error("Unexpected status code: " + resp.statusCode));
    } else if (body.user && parseInt(body.user.available_slots) <= 0) {
      cb(new Error("Account is valid, but no available slots are left."));
    } else if (body.user && body.user.key) {
      cb(null, {api_key: body.user.key});
    } else {
      cb(new Error("Unknown error ocurred. Please try again later."));
    }
 });

}

exports.verify = function(args, cb){
  if (!args.api_key || !args.device_key)
    return cb(new Error('Both API and Device keys are needed.'));

  var root = get_root();
  if (!root) return cb(new Error('Control Panel host not set!'));

  log('Verifying keys...');
  var url = root + '/devices/' + args.device_key + '.xml',
      opts = base_opts;

  opts.username = args.api_key;
  opts.password = 'x';

  http_client.put(url, '1=1', opts, function(err, resp, body){
    if (err) return cb(err);

    log('Got status code: ' + resp.statusCode);

    if (resp.statusCode === 200)
      cb()
    else if (resp.statusCode === 404)
      cb(new Error('Device not found!'))
    else if (resp.statusCode === 401)
      cb(new Error('Invalid credentials.'))
    else
      cb(new Error(body.toString()))
  })
}

exports.signup = function(args, cb){
  var root = get_root();
  if (!root) return cb(new Error('Control Panel host not set!'))

  log('Signing you up...');
  var url = root + '/signup.xml';

  http_client.post(url, args, base_opts, function(err, resp, body){
    if (err) return callback(err);

    if (body && body.user && body.user.key)
      cb(null, {api_key: body.user.key});
    else
      cb(new Error(inspect(body)));
  });
}
