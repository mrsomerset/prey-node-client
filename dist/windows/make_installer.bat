
REM "Creates an MSI package for prey"

:: rd /s /q tmp_package
del prey-test.msi
del prey-installable-test.*
del main.wixobj

:: mkdir tmp_package
:: xcopy ..\..\bin tmp_package\bin /i /s
:: xcopy ..\..\lib tmp_package\lib /i /s
:: xcopy ..\..\node_modules tmp_package\node_modules /i /s
:: xcopy ..\..\scripts tmp_package\scripts /i /s
:: xcopy ..\..\test tmp_package\test /i /s
:: copy ..\..\* tmp_package

".\bin\paraffin" prey-installable-test.wxs ^
-dir tmp_package ^
-groupname herman-test

".\bin\candle" ^
prey-installable-test.wxs main.wxs

".\bin\light" ^
-out prey-test.msi prey-installable-test.wixobj main.wixobj

@pause