var registry = require('./registry'),
    reg_path = 'HKLM\\Software\\Prey';

// A variable setter hack
// TODO: We'll need to put all our variables in
//       _A_ big internal settings file (HJ).
if (process.flag_test_prey_on) reg_path = reg_path.replace('Prey', 'Test_Prey')

exports.get = function(cb) {
  registry.get(reg_path, 'Delay', function(err, val){
    if (err) return cb();
    var obj = {
      value: val / (60 * 1000),
      one_hour: val == (60 * 60 * 1000)
    }
    cb(obj);
  })
};

exports.set = function (new_delay, cb) {
  var number = new_delay * 60 * 1000; // delay is passed in minutes
  registry.set(reg_path, 'Delay', number, cb);
};

exports.unset = function (cb) {
  registry.del(reg_path, 'Delay', cb);
}
