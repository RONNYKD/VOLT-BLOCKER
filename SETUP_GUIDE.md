# 🚀 VOLT App - Complete Setup Guide

## 📋 Prerequisites

Before setting up VOLT, ensure you have the following installed:

### **Required Software**
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **React Native CLI** - Install with `npm install -g react-native-cli`
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Java Development Kit (JDK 11)** - Required for Android development

### **Hardware Requirements**
- **Android Device** (API level 21+) OR **Android Emulator**
- **USB Cable** (for physical device testing)
- **Minimum 4GB RAM** (8GB recommended for emulator)

## 🔧 Environment Setup

### **1. Android Development Environment**

#### **Install Android Studio**
1. Download and install Android Studio
2. Open Android Studio and go to **SDK Manager**
3. Install the following SDK components:
   - **Android SDK Platform 33** (or latest)
   - **Android SDK Build-Tools**
   - **Android SDK Platform-Tools**
   - **Android Emulator**

#### **Configure Environment Variables**
Add these to your system environment variables:

**Windows:**
```bash
ANDROID_HOME=C:\Users\[USERNAME]\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\[USERNAME]\AppData\Local\Android\Sdk
```

**macOS/Linux:**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### **2. Device Setup**

#### **Option A: Physical Android Device**
1. Enable **Developer Options** on your device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable **USB Debugging** in Developer Options
3. Connect device via USB
4. Verify connection: `adb devices`

#### **Option B: Android Emulator**
1. Open Android Studio
2. Go to **AVD Manager**
3. Create a new Virtual Device:
   - Choose **Pixel 4** or similar
   - Select **API Level 30+**
   - Allocate **4GB+ RAM**
4. Start the emulator

## 📦 Installation Steps

### **1. Clone the Repository**
```bash
git clone https://github.com/RONNYKD/volt-app.git
cd volt-app
```

### **2. Install Dependencies**
```bash
# Install Node.js dependencies
npm install

# For iOS (if developing for iOS later)
cd ios && pod install && cd ..
```

### **3. Android Setup**
```bash
# Navigate to android directory
cd android

# Clean previous builds
./gradlew clean

# Return to project root
cd ..
```

### **4. Environment Configuration**

#### **Create Environment File**
Create a `.env` file in the project root:
```env
# Supabase Configuration (Optional for basic testing)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
APP_ENV=development
DEBUG_MODE=true
```

#### **Configure Supabase (Optional)**
If you want to test cloud features:
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and anon key to `.env` file
4. Run database setup (see `SUPABASE_SETUP.md`)

## 🏃‍♂️ Running the App

### **Development Mode**
```bash
# Start Metro bundler
npx react-native start

# In another terminal, run Android app
npx react-native run-android
```

### **Release Mode (Recommended for Testing)**
```bash
# Build and install release version
npx react-native run-android --mode=release
```

### **Troubleshooting Build Issues**

#### **Common Issues & Solutions**

**1. Metro bundler issues:**
```bash
# Clear Metro cache
npx react-native start --reset-cache
```

**2. Android build failures:**
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx react-native run-android
```

**3. Device not detected:**
```bash
# Check device connection
adb devices

# Restart ADB server
adb kill-server
adb start-server
```

**4. Permission issues:**
```bash
# Grant permissions manually on device
# Go to Settings → Apps → VOLT → Permissions
# Enable all requested permissions
```

## 📱 First Launch Setup

### **1. Initial App Setup**
1. **Launch VOLT** from your device
2. **Grant Permissions** when prompted:
   - Accessibility Service (for app blocking)
   - Usage Access (for app monitoring)
   - Notification Access (for session alerts)
   - Device Admin (for uninstall protection)

### **2. Account Creation**
1. **Register** a new account or **Login**
2. **Complete onboarding** tutorial
3. **Set up your first focus session**

### **3. Testing Core Features**
1. **Add Apps to Block**:
   - Go to Blocks tab
   - Tap "Add App"
   - Select apps like Instagram, YouTube
   
2. **Start Focus Session**:
   - Go to Focus tab
   - Select 2-minute duration (for quick testing)
   - Tap "Start Focus Session"
   
3. **Test Blocking**:
   - Try to open blocked apps
   - Verify they are blocked during session

## 🔧 Advanced Configuration

### **1. Native Module Permissions**

The app requires several Android permissions for full functionality:

```xml
<!-- Required for app blocking -->
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />
<uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />

<!-- Required for notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Required for uninstall protection -->
<uses-permission android:name="android.permission.BIND_DEVICE_ADMIN" />
```

### **2. Accessibility Service Setup**
1. Go to **Settings → Accessibility**
2. Find **VOLT Accessibility Service**
3. **Enable** the service
4. Grant necessary permissions

### **3. Device Admin Setup**
1. Go to **Settings → Security → Device Admin Apps**
2. Find **VOLT Device Admin**
3. **Activate** device administrator
4. This enables uninstall protection

## 🧪 Testing Guide for Judges

### **Quick Test Sequence (5 minutes)**
1. **Install and Launch**: Follow setup steps above
2. **Create Account**: Register with test credentials
3. **Add Blocked Apps**: Add 2-3 social media apps
4. **Start 2-Minute Session**: Quick test session
5. **Verify Blocking**: Try to open blocked apps
6. **Complete Session**: Wait for completion notification

### **Comprehensive Test (15 minutes)**
1. **All Basic Features**: Complete quick test above
2. **Website Blocking**: Add websites and test browser blocking
3. **Permanent Blocking**: Enable permanent mode
4. **App Lifecycle**: Minimize/restore app multiple times
5. **UI Navigation**: Explore all screens and features
6. **Uninstall Protection**: Try to uninstall during session

### **Performance Testing**
- **Smooth Animations**: Check for 60fps performance
- **Memory Usage**: Monitor RAM consumption
- **Battery Impact**: Check background service efficiency
- **Crash Testing**: Stress test app lifecycle

## 🐛 Troubleshooting

### **App Won't Start**
```bash
# Check React Native doctor
npx react-native doctor

# Verify Android setup
adb devices
```

### **Blocking Not Working**
1. **Check Permissions**: Ensure all permissions granted
2. **Accessibility Service**: Verify service is enabled
3. **Usage Access**: Confirm usage stats permission
4. **Restart App**: Close and reopen VOLT

### **Build Errors**
```bash
# Clean everything
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npx react-native run-android
```

### **Performance Issues**
1. **Use Release Build**: Always test with `--mode=release`
2. **Close Other Apps**: Free up device memory
3. **Restart Device**: Clear system cache

## 📞 Support & Contact

### **For Judges & Evaluators**
If you encounter any issues during setup or testing:

1. **Check this guide** for common solutions
2. **Review error messages** carefully
3. **Try release build** if development build fails
4. **Contact developer** if critical issues persist

### **Developer Contact**
- **GitHub**: [@RONNYKD](https://github.com/RONNYKD)
- **Repository**: [volt-app](https://github.com/RONNYKD/volt-app)

## ✅ Setup Verification Checklist

Before testing, ensure:
- [ ] Android Studio and SDK installed
- [ ] Device/emulator connected and detected
- [ ] Node.js and React Native CLI installed
- [ ] Project dependencies installed (`npm install`)
- [ ] App builds successfully
- [ ] App launches without crashes
- [ ] All permissions granted on device
- [ ] Accessibility service enabled
- [ ] Basic blocking functionality works

---

**Ready to experience VOLT? Follow this guide and start your focused productivity journey!**

*For the best evaluation experience, we recommend using a physical Android device with the release build.*