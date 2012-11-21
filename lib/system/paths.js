var fs = require('fs'),
    path = require('path'),
    package_path  = path.resolve(__dirname, '..', '..'),
    os_name = process.platform.replace('darwin', 'mac').replace('win32', 'windows'),
    paths = require(path.join(__dirname, os_name, 'paths'));

module.exports = paths;
paths.package = package_path;
paths.install = package_path;
paths.current = package_path;
paths.package_bin = path.join(package_path, paths.prey_bin);

// check if parent path directory is called 'versions'. if not, then we assume
// this was installed on a static location (eg. via apt-get), which means we
// can't keep different versions.

var package_parent_path = fs.realpathSync(path.resolve(package_path, '..'));

if (path.basename(package_parent_path) == 'versions') {
  paths.install  = path.resolve(package_parent_path, '..');
  paths.current  = path.join(paths.install, 'current');
  paths.versions = path.join(paths.install, 'versions');
}

paths.bin_path = path.join(paths.current, paths.prey_bin);