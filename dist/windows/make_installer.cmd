
REM "Creates an MSI package for prey"

del prey-msi.*
del main.wixobj

".\bin\paraffin" prey-msi.wxs ^
-dir source-package ^
-groupname prey-msi

".\bin\candle" ^
prey-msi.wxs main.wxs

".\bin\light" ^
-out prey-msi.msi prey-msi.wixobj main.wixobj
