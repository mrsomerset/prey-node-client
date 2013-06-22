
REM "Creates an MSI package for prey"

set productVersion=%1

del prey-msi.*
del main.wixobj

".\bin\paraffin" prey-msi.wxs ^
-nrd ^
-dir source-package ^
-alias source-package ^
-groupname prey-msi

".\bin\candle" ^
-dProductVersion=%productVersion% ^
prey-msi.wxs main.wxs

".\bin\light" ^
-ext WixNetFxExtension ^
-out prey-msi.msi prey-msi.wixobj main.wixobj
