
REM "Creates an MSI package for prey"

set version=0.10.0

del prey-msi.*
del main.wixobj

rd /s /q versions
mkdir versions
xcopy ..\..\bin versions\%version%\bin /i /s
xcopy ..\..\lib versions\%version%\lib /i /s

mkdir versions\%version%\node_modules
xcopy ..\..\node_modules\commander versions\%version%\node_modules\commander /i /s
xcopy ..\..\node_modules\getset versions\%version%\node_modules\getset /i /s
xcopy ..\..\node_modules\qs versions\%version%\node_modules\qs /i /s
xcopy ..\..\node_modules\needle versions\%version%\node_modules\needle /i /s
xcopy ..\..\node_modules\xml2js versions\%version%\node_modules\xml2js /i /s
xcopy ..\..\node_modules\dialog versions\%version%\node_modules\dialog /i /s
xcopy ..\..\node_modules\mime versions\%version%\node_modules\mime /i /s
xcopy ..\..\node_modules\reply versions\%version%\node_modules\reply /i /s
xcopy ..\..\node_modules\async versions\%version%\node_modules\async /i /s
xcopy ..\..\node_modules\underscore versions\%version%\node_modules\underscore /i /s
xcopy ..\..\node_modules\unzip versions\%version%\node_modules\unzip /i /s
xcopy ..\..\node_modules\campfire versions\%version%\node_modules\campfire /i /s
xcopy ..\..\node_modules\nodemailer versions\%version%\node_modules\nodemailer /i /s
xcopy ..\..\node_modules\connect versions\%version%\node_modules\connect /i /s
xcopy ..\..\node_modules\entry versions\%version%\node_modules\entry /i /s
xcopy ..\..\node_modules\triggers versions\%version%\node_modules\triggers /i /s

xcopy ..\..\scripts versions\%version%\scripts /i /s
xcopy ..\..\test versions\%version%\test /i /s

copy ..\..\index.js versions\%version%\.
copy ..\..\license.txt versions\%version%
copy ..\..\package.json versions\%version%
copy ..\..\prey.conf.defaults versions\%version%
copy ..\..\README.md versions\%version%

".\bin\paraffin" prey-msi.wxs ^
-dir versions ^
-groupname prey-msi

".\bin\candle" ^
prey-msi.wxs main.wxs ^
-ext WixUIExtension -ext WixUtilExtension

".\bin\light" ^
-out prey-msi.msi prey-msi.wixobj main.wixobj ^
-ext WixUIExtension -ext WixUtilExtension
