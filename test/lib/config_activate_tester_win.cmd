::####################################################################
:: TEST LIBRARY
::
:: Prey Client
::
:: Script to install testing environment for
:: "[./bin/prey] config activate"
::
:: in the windows OS
::
::####################################################################

:: @echo off

IF exist %2 (rd /s /q %2)
md %2\node_modules
md %2\node_modules\async
xcopy /e /q %1\node_modules\async %2\node_modules\async
md %2\node_modules\commander
xcopy /e /q %1\node_modules\commander %2\node_modules\commander
md %2\node_modules\dialog
xcopy /e /q %1\node_modules\dialog %2\node_modules\dialog
md %2\node_modules\getset
xcopy /e /q %1\node_modules\getset %2\node_modules\getset
md %2\node_modules\needle
xcopy /e /q %1\node_modules\needle %2\node_modules\needle
md %2\node_modules\reply
xcopy /e /q %1\node_modules\reply %2\node_modules\reply
md %2\node_modules\sandboxed-module
xcopy /e /q %1\node_modules\sandboxed-module %2\node_modules\sandboxed-module

md %2\lib
xcopy /e /q %1\lib %2\lib

copy %1\prey.conf.default %2\prey.conf.default
copy %1\package.json %2\package.json

copy %1\test\lib\config_activate_tester_win.js %2\config_activate_tester_win.js
