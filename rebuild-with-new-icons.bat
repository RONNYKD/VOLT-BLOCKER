@echo off
echo 🚀 VOLT App Icon Update and Rebuild Script
echo ==========================================

echo.
echo 📱 Step 1: Uninstalling old app from device...
adb uninstall com.volt
if %errorlevel% equ 0 (
    echo ✅ App uninstalled successfully
) else (
    echo ⚠️  App may not have been installed or device not connected
)

echo.
echo 🧹 Step 2: Cleaning build caches...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q %TEMP%\metro-* 2>nul
rmdir /s /q %TEMP%\react-* 2>nul
echo ✅ Metro cache cleaned

echo.
echo 🔨 Step 3: Cleaning Android build...
cd android
call gradlew clean
cd ..
echo ✅ Android build cleaned

echo.
echo 📦 Step 4: Building and installing app with new icons...
npx react-native run-android --port=8081

echo.
echo ✨ Rebuild complete! 
echo 📱 The app should now have the new VOLT icons.
echo 💡 If icons still don't update, restart your device and try again.

pause
