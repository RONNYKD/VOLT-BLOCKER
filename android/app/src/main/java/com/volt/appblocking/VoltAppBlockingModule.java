
package com.volt.appblocking;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.app.usage.UsageStatsManager;
import android.content.pm.PackageManager;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.app.usage.UsageStats;
import android.graphics.drawable.Drawable;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.Calendar;
import java.util.Set;
import java.util.HashSet;
import java.io.ByteArrayOutputStream;

public class VoltAppBlockingModule extends ReactContextBaseJavaModule {
    private static final String TAG = "VoltAppBlocking";
    private final ReactApplicationContext reactContext;
    private PackageManager packageManager;
    private UsageStatsManager usageStatsManager;

    // App categories for classification
    public enum AppCategory {
        USER_APP, // Regular user-installed apps
        SYSTEM_DISTRACTING, // System apps that can be distracting (browsers, social media)
        SYSTEM_ESSENTIAL, // Essential system apps (should not be blocked)
        SYSTEM_UTILITY // System utility apps (can be blocked with warning)
    }

    // Critical system apps that should NEVER be blocked
    private static final Set<String> CRITICAL_SYSTEM_APPS = new HashSet<>();
    static {
        // Launchers and home screens
        CRITICAL_SYSTEM_APPS.add("com.google.android.apps.nexuslauncher");
        CRITICAL_SYSTEM_APPS.add("com.android.launcher3");
        CRITICAL_SYSTEM_APPS.add("com.android.launcher2");
        CRITICAL_SYSTEM_APPS.add("com.sec.android.app.launcher");
        CRITICAL_SYSTEM_APPS.add("com.miui.home");
        CRITICAL_SYSTEM_APPS.add("com.huawei.android.launcher");
        CRITICAL_SYSTEM_APPS.add("com.oneplus.launcher");

        // System settings and core services
        CRITICAL_SYSTEM_APPS.add("com.android.settings");
        CRITICAL_SYSTEM_APPS.add("com.android.systemui");
        CRITICAL_SYSTEM_APPS.add("android");
        CRITICAL_SYSTEM_APPS.add("com.android.phone");
        CRITICAL_SYSTEM_APPS.add("com.android.dialer");
        CRITICAL_SYSTEM_APPS.add("com.google.android.dialer");
        CRITICAL_SYSTEM_APPS.add("com.samsung.android.dialer");

        // Emergency and security
        CRITICAL_SYSTEM_APPS.add("com.android.emergency");
        CRITICAL_SYSTEM_APPS.add("com.android.contacts");
        CRITICAL_SYSTEM_APPS.add("com.google.android.contacts");
        CRITICAL_SYSTEM_APPS.add("com.samsung.android.contacts");

        // Core Android services
        CRITICAL_SYSTEM_APPS.add("com.google.android.gms");
        CRITICAL_SYSTEM_APPS.add("com.google.android.gsf");
        CRITICAL_SYSTEM_APPS.add("com.android.vending");
    }

    // Commonly distracting system apps that users often want to block
    private static final Set<String> DISTRACTING_SYSTEM_APPS = new HashSet<>();
    static {
        // Browsers
        DISTRACTING_SYSTEM_APPS.add("com.android.chrome");
        DISTRACTING_SYSTEM_APPS.add("com.chrome.beta");
        DISTRACTING_SYSTEM_APPS.add("com.chrome.dev");
        DISTRACTING_SYSTEM_APPS.add("com.sec.android.app.sbrowser");
        DISTRACTING_SYSTEM_APPS.add("org.mozilla.firefox");
        DISTRACTING_SYSTEM_APPS.add("com.microsoft.emmx");
        DISTRACTING_SYSTEM_APPS.add("com.opera.browser");

        // Google apps
        DISTRACTING_SYSTEM_APPS.add("com.google.android.youtube");
        DISTRACTING_SYSTEM_APPS.add("com.google.android.apps.youtube.music");
        DISTRACTING_SYSTEM_APPS.add("com.google.android.gm");
        DISTRACTING_SYSTEM_APPS.add("com.google.android.apps.maps");
        DISTRACTING_SYSTEM_APPS.add("com.google.android.googlequicksearchbox");
        DISTRACTING_SYSTEM_APPS.add("com.google.android.apps.photos");
        DISTRACTING_SYSTEM_APPS.add("com.google.android.apps.messaging");

        // Samsung apps
        DISTRACTING_SYSTEM_APPS.add("com.samsung.android.messaging");
        DISTRACTING_SYSTEM_APPS.add("com.samsung.android.email.provider");
        DISTRACTING_SYSTEM_APPS.add("com.samsung.android.gallery3d");
        DISTRACTING_SYSTEM_APPS.add("com.samsung.android.video");

        // Other common system apps
        DISTRACTING_SYSTEM_APPS.add("com.android.gallery3d");
        DISTRACTING_SYSTEM_APPS.add("com.android.music");
        DISTRACTING_SYSTEM_APPS.add("com.android.email");
    }

    // System utility apps that can be blocked but with warning
    private static final Set<String> UTILITY_SYSTEM_APPS = new HashSet<>();
    static {
        UTILITY_SYSTEM_APPS.add("com.android.calculator2");
        UTILITY_SYSTEM_APPS.add("com.google.android.calculator");
        UTILITY_SYSTEM_APPS.add("com.android.calendar");
        UTILITY_SYSTEM_APPS.add("com.google.android.calendar");
        UTILITY_SYSTEM_APPS.add("com.android.camera2");
        UTILITY_SYSTEM_APPS.add("com.google.android.GoogleCamera");
        UTILITY_SYSTEM_APPS.add("com.samsung.android.app.notes");
        UTILITY_SYSTEM_APPS.add("com.google.android.keep");
        UTILITY_SYSTEM_APPS.add("com.android.deskclock");
        UTILITY_SYSTEM_APPS.add("com.google.android.deskclock");
    }

    public VoltAppBlockingModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.packageManager = reactContext.getPackageManager();
        this.usageStatsManager = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
    }

    @Override
    public String getName() {
        return "VoltAppBlocking";
    }

    // ============ PERMISSION METHODS ============

    @ReactMethod
    public void hasUsageStatsPermission(Promise promise) {
        try {
            boolean hasPermission = checkUsageStatsPermission();
            Log.d(TAG, "Usage stats permission check: " + hasPermission);
            promise.resolve(hasPermission);
        } catch (Exception e) {
            Log.e(TAG, "Error checking usage stats permission", e);
            promise.reject("PERMISSION_CHECK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestUsageStatsPermission(Promise promise) {
        try {
            Log.d(TAG, "Requesting usage stats permission");
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);

            // Note: We can't directly know if permission was granted
            // The user needs to manually grant it in settings
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error requesting usage stats permission", e);
            promise.reject("PERMISSION_REQUEST_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void hasAccessibilityPermission(Promise promise) {
        try {
            boolean hasPermission = isAccessibilityServiceEnabled();
            Log.d(TAG, "Accessibility permission check: " + hasPermission);
            promise.resolve(hasPermission);
        } catch (Exception e) {
            Log.e(TAG, "Error checking accessibility permission", e);
            promise.reject("PERMISSION_CHECK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestAccessibilityPermission(Promise promise) {
        try {
            Log.d(TAG, "Requesting accessibility permission");
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);

            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error requesting accessibility permission", e);
            promise.reject("PERMISSION_REQUEST_ERROR", e.getMessage());
        }
    }

    // ============ APP MANAGEMENT METHODS ============

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            Log.d(TAG, "Getting installed apps (including system apps)");
            WritableArray apps = Arguments.createArray();

            List<PackageInfo> packages = packageManager.getInstalledPackages(PackageManager.GET_META_DATA);

            for (PackageInfo packageInfo : packages) {
                try {
                    ApplicationInfo appInfo = packageInfo.applicationInfo;
                    String packageName = packageInfo.packageName;

                    // Skip critical system apps that should never be blocked
                    if (CRITICAL_SYSTEM_APPS.contains(packageName)) {
                        Log.d(TAG, "Skipping critical system app: " + packageName);
                        continue;
                    }

                    // Skip apps without a launcher icon (background services, etc.)
                    Intent launchIntent = packageManager.getLaunchIntentForPackage(packageName);
                    if (launchIntent == null) {
                        Log.d(TAG, "Skipping app without launcher: " + packageName);
                        continue;
                    }

                    // Determine app category
                    AppCategory category = classifyApp(packageName, appInfo);

                    WritableMap appMap = Arguments.createMap();
                    appMap.putString("packageName", packageName);
                    appMap.putString("appName", packageManager.getApplicationLabel(appInfo).toString());
                    appMap.putBoolean("isSystemApp", (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                    appMap.putString("category", category.name());
                    appMap.putString("categoryDisplay", getCategoryDisplayName(category));
                    appMap.putBoolean("isRecommendedForBlocking", category == AppCategory.SYSTEM_DISTRACTING);
                    appMap.putBoolean("requiresWarning", category == AppCategory.SYSTEM_UTILITY);
                    appMap.putDouble("installTime", packageInfo.firstInstallTime);
                    appMap.putDouble("lastUpdateTime", packageInfo.lastUpdateTime);
                    appMap.putString("versionName",
                            packageInfo.versionName != null ? packageInfo.versionName : "Unknown");
                    appMap.putInt("versionCode", packageInfo.versionCode);

                    // Try to get app icon (optional, can be resource intensive)
                    try {
                        String iconBase64 = getAppIconBase64(packageName);
                        if (iconBase64 != null) {
                            appMap.putString("icon", iconBase64);
                        }
                    } catch (Exception iconError) {
                        Log.w(TAG, "Could not get icon for " + packageName, iconError);
                    }

                    apps.pushMap(appMap);
                } catch (Exception appError) {
                    Log.w(TAG, "Error processing app: " + packageInfo.packageName, appError);
                }
            }

            Log.d(TAG, "Found " + apps.size() + " installed apps (including system apps)");
            promise.resolve(apps);
        } catch (Exception e) {
            Log.e(TAG, "Error getting installed apps", e);
            promise.reject("GET_APPS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getDistractingApps(Promise promise) {
        try {
            Log.d(TAG, "Getting commonly distracting apps");
            WritableArray apps = Arguments.createArray();

            List<PackageInfo> packages = packageManager.getInstalledPackages(PackageManager.GET_META_DATA);

            for (PackageInfo packageInfo : packages) {
                try {
                    String packageName = packageInfo.packageName;
                    ApplicationInfo appInfo = packageInfo.applicationInfo;

                    // Only include apps that are commonly distracting
                    if (DISTRACTING_SYSTEM_APPS.contains(packageName) ||
                            (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {

                        // Skip if no launcher intent
                        Intent launchIntent = packageManager.getLaunchIntentForPackage(packageName);
                        if (launchIntent == null) {
                            continue;
                        }

                        WritableMap appMap = Arguments.createMap();
                        appMap.putString("packageName", packageName);
                        appMap.putString("appName", packageManager.getApplicationLabel(appInfo).toString());
                        appMap.putBoolean("isSystemApp", (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                        appMap.putBoolean("isRecommended", DISTRACTING_SYSTEM_APPS.contains(packageName));

                        apps.pushMap(appMap);
                    }
                } catch (Exception appError) {
                    Log.w(TAG, "Error processing distracting app: " + packageInfo.packageName, appError);
                }
            }

            Log.d(TAG, "Found " + apps.size() + " potentially distracting apps");
            promise.resolve(apps);
        } catch (Exception e) {
            Log.e(TAG, "Error getting distracting apps", e);
            promise.reject("GET_DISTRACTING_APPS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void validateAppForBlocking(String packageName, Promise promise) {
        try {
            Log.d(TAG, "Validating app for blocking: " + packageName);

            WritableMap result = Arguments.createMap();

            if (CRITICAL_SYSTEM_APPS.contains(packageName)) {
                result.putBoolean("canBlock", false);
                result.putString("reason", "CRITICAL_SYSTEM_APP");
                result.putString("message",
                        "This is a critical system app that cannot be blocked for security reasons.");
            } else {
                ApplicationInfo appInfo;
                try {
                    appInfo = packageManager.getApplicationInfo(packageName, 0);
                } catch (PackageManager.NameNotFoundException e) {
                    result.putBoolean("canBlock", false);
                    result.putString("reason", "APP_NOT_FOUND");
                    result.putString("message", "App not found on device.");
                    promise.resolve(result);
                    return;
                }

                AppCategory category = classifyApp(packageName, appInfo);

                result.putBoolean("canBlock", true);
                result.putString("category", category.name());
                result.putBoolean("requiresWarning", category == AppCategory.SYSTEM_UTILITY);

                if (category == AppCategory.SYSTEM_UTILITY) {
                    result.putString("warningMessage",
                            "This is a system utility app. Blocking it may affect device functionality.");
                }
            }

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error validating app for blocking", e);
            promise.reject("VALIDATE_APP_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getAppUsageStats(double startTime, double endTime, Promise promise) {
        try {
            Log.d(TAG, "Getting app usage stats");

            if (!checkUsageStatsPermission()) {
                promise.reject("PERMISSION_ERROR", "Usage stats permission not granted");
                return;
            }

            WritableArray statsArray = Arguments.createArray();

            Map<String, UsageStats> stats = usageStatsManager.queryAndAggregateUsageStats(
                    (long) startTime, (long) endTime);

            for (Map.Entry<String, UsageStats> entry : stats.entrySet()) {
                try {
                    UsageStats usageStats = entry.getValue();

                    // Skip apps with no usage
                    if (usageStats.getTotalTimeInForeground() == 0) {
                        continue;
                    }

                    WritableMap statMap = Arguments.createMap();
                    statMap.putString("packageName", usageStats.getPackageName());

                    // Try to get app name
                    try {
                        ApplicationInfo appInfo = packageManager.getApplicationInfo(usageStats.getPackageName(), 0);
                        statMap.putString("appName", packageManager.getApplicationLabel(appInfo).toString());
                    } catch (PackageManager.NameNotFoundException e) {
                        statMap.putString("appName", usageStats.getPackageName());
                    }

                    statMap.putDouble("totalTimeInForeground", usageStats.getTotalTimeInForeground());
                    statMap.putDouble("firstTimeStamp", usageStats.getFirstTimeStamp());
                    statMap.putDouble("lastTimeStamp", usageStats.getLastTimeStamp());
                    statMap.putDouble("lastTimeUsed", usageStats.getLastTimeUsed());

                    statsArray.pushMap(statMap);
                } catch (Exception statError) {
                    Log.w(TAG, "Error processing usage stat", statError);
                }
            }

            Log.d(TAG, "Found " + statsArray.size() + " usage stats");
            promise.resolve(statsArray);
        } catch (Exception e) {
            Log.e(TAG, "Error getting usage stats", e);
            promise.reject("GET_USAGE_STATS_ERROR", e.getMessage());
        }
    }

    // ============ BLOCKING METHODS ============

    @ReactMethod
    public void startBlocking(ReadableArray packageNames, Promise promise) {
        try {
            Log.d(TAG, "Starting blocking for " + packageNames.size() + " apps");

            List<String> packages = new ArrayList<>();
            for (int i = 0; i < packageNames.size(); i++) {
                String packageName = packageNames.getString(i);
                packages.add(packageName);
                Log.d(TAG, "Will block: " + packageName);
            }

            // Update accessibility service directly
            VoltAccessibilityService.setBlockedPackages(packages);
            VoltAccessibilityService.setBlockingActive(true);
            
            Log.d(TAG, "Successfully started blocking " + packages.size() + " apps");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error starting blocking", e);
            promise.reject("START_BLOCKING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopBlocking(Promise promise) {
        try {
            Log.d(TAG, "stopBlocking() called - checking permanent blocking protection");

            // Check if permanent blocking is active
            SharedPreferences prefs = reactContext.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
            boolean isPermanentBlocking = prefs.getBoolean("permanent_blocking_active", false);
            
            Log.d(TAG, "Permanent blocking active: " + isPermanentBlocking);

            if (isPermanentBlocking) {
                Log.d(TAG, "Permanent blocking is active - checking 2-hour delay");

                boolean isPending = prefs.getBoolean("disable_request_pending", false);
                long disableTime = prefs.getLong("disable_request_time", 0);
                long currentTime = System.currentTimeMillis();

                if (!isPending) {
                    // No disable request made yet
                    promise.reject("PERMANENT_BLOCKING_ACTIVE",
                            "Permanent blocking is active. You must request to disable it and wait 2 hours.");
                    return;
                } else if (currentTime < disableTime) {
                    // Still waiting for 2-hour delay
                    long remainingMs = disableTime - currentTime;
                    double remainingMinutes = remainingMs / (1000.0 * 60.0);
                    promise.reject("DISABLE_REQUEST_PENDING",
                            "You must wait " + String.format("%.1f", remainingMinutes)
                                    + " more minutes before disabling blocking.");
                    return;
                }

                // 2-hour delay has passed, allow disabling
                Log.d(TAG, "2-hour delay completed, allowing disable");
            }

            // Stop blocking in accessibility service
            VoltAccessibilityService.setBlockingActive(false);
            VoltAccessibilityService.setBlockedPackages(new ArrayList<>());
            
            Log.d(TAG, "Successfully stopped all blocking");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping blocking", e);
            promise.reject("STOP_BLOCKING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isBlocking(Promise promise) {
        try {
            // Check blocking status from accessibility service
            boolean blocking = VoltAccessibilityService.isBlockingActive();

            Log.d(TAG, "Blocking status: " + blocking);
            promise.resolve(blocking);
        } catch (Exception e) {
            Log.e(TAG, "Error checking blocking status", e);
            promise.reject("BLOCKING_STATUS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void addBlockedApp(String packageName, Promise promise) {
        try {
            Log.d(TAG, "Adding blocked app: " + packageName);

            // TODO: Implement VoltBlockingManager
            // For now, just return success to test the 2-hour delay system
            boolean success = true;

            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error adding blocked app", e);
            promise.reject("ADD_BLOCKED_APP_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void removeBlockedApp(String packageName, Promise promise) {
        try {
            Log.d(TAG, "Removing blocked app: " + packageName);

            // TODO: Implement VoltBlockingManager
            // For now, just return success to test the 2-hour delay system
            boolean success = true;

            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error removing blocked app", e);
            promise.reject("REMOVE_BLOCKED_APP_ERROR", e.getMessage());
        }
    }

    // ============ FOCUS SESSION METHODS ============

    @ReactMethod
    public void startFocusSession(int duration, ReadableArray blockedApps, Promise promise) {
        try {
            Log.d(TAG, "Starting focus session: " + duration + " minutes, " + blockedApps.size() + " blocked apps");

            List<String> packages = new ArrayList<>();
            for (int i = 0; i < blockedApps.size(); i++) {
                String packageName = blockedApps.getString(i);
                packages.add(packageName);
            }

            // TODO: Implement VoltBlockingManager
            // For now, just return success to test the 2-hour delay system
            boolean success = true;

            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error starting focus session", e);
            promise.reject("START_FOCUS_SESSION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopFocusSession(Promise promise) {
        try {
            Log.d(TAG, "Stopping focus session");

            // TODO: Implement VoltBlockingManager
            // For now, just return success to test the 2-hour delay system
            boolean success = true;

            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping focus session", e);
            promise.reject("STOP_FOCUS_SESSION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void pauseFocusSession(Promise promise) {
        try {
            Log.d(TAG, "Pausing focus session");

            // TODO: Implement VoltBlockingManager
            // For now, just return success to test the 2-hour delay system
            boolean success = true;

            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error pausing focus session", e);
            promise.reject("PAUSE_FOCUS_SESSION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void resumeFocusSession(Promise promise) {
        try {
            Log.d(TAG, "Resuming focus session");

            // TODO: Implement VoltBlockingManager
            // For now, just return success to test the 2-hour delay system
            boolean success = true;

            promise.resolve(success);
        } catch (Exception e) {
            Log.e(TAG, "Error resuming focus session", e);
            promise.reject("RESUME_FOCUS_SESSION_ERROR", e.getMessage());
        }
    }

    // ============ PERMANENT BLOCKING WITH 2-HOUR DELAY ============

    @ReactMethod
    public void enablePermanentBlocking(Promise promise) {
        try {
            Log.d(TAG, "Enabling permanent blocking mode");

            SharedPreferences prefs = reactContext.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putBoolean("permanent_blocking_active", true);
            editor.apply();

            Log.d(TAG, "Permanent blocking mode enabled");

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message",
                    "Permanent blocking mode enabled. Apps can only be disabled after a 2-hour delay.");

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error enabling permanent blocking", e);
            promise.reject("ENABLE_PERMANENT_BLOCKING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void disablePermanentBlocking(Promise promise) {
        try {
            Log.d(TAG, "Disabling permanent blocking mode");

            SharedPreferences prefs = reactContext.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putBoolean("permanent_blocking_active", false);
            editor.remove("disable_request_time");
            editor.putBoolean("disable_request_pending", false);
            editor.apply();

            // Stop countdown notification service
            VoltCountdownService.stopCountdown(reactContext);

            Log.d(TAG, "Permanent blocking mode disabled");

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "Permanent blocking mode disabled");

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error disabling permanent blocking", e);
            promise.reject("DISABLE_PERMANENT_BLOCKING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isPermanentBlockingActive(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
            boolean isActive = prefs.getBoolean("permanent_blocking_active", false);

            Log.d(TAG, "Permanent blocking active: " + isActive);
            promise.resolve(isActive);
        } catch (Exception e) {
            Log.e(TAG, "Error checking permanent blocking status", e);
            promise.reject("CHECK_PERMANENT_BLOCKING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestDisableBlocking(Promise promise) {
        try {
            Log.d(TAG, "Requesting disable blocking with 2-hour delay");

            // Calculate disable time = current time + 2 hours (in milliseconds)
            long currentTime = System.currentTimeMillis();
            long twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
            long disableTime = currentTime + twoHoursInMs;

            // Store the disable request timestamp
            SharedPreferences prefs = reactContext.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putLong("disable_request_time", disableTime);
            editor.putBoolean("disable_request_pending", true);
            editor.apply();

            // Start countdown notification service
            VoltCountdownService.startCountdown(reactContext, disableTime);

            Log.d(TAG, "Disable request scheduled for: " + new java.util.Date(disableTime));

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putDouble("disableTime", disableTime);
            result.putString("message", "Blocking will be disabled in 2 hours");

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error requesting disable blocking", e);
            promise.reject("REQUEST_DISABLE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void cancelDisableRequest(Promise promise) {
        try {
            Log.d(TAG, "Canceling disable blocking request");

            // Remove the disable request
            SharedPreferences prefs = reactContext.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.remove("disable_request_time");
            editor.putBoolean("disable_request_pending", false);
            editor.apply();

            // Stop countdown notification service
            VoltCountdownService.stopCountdown(reactContext);

            Log.d(TAG, "Disable request canceled successfully");

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "Disable request canceled");

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error canceling disable request", e);
            promise.reject("CANCEL_DISABLE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getDisableStatus(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
            boolean isPending = prefs.getBoolean("disable_request_pending", false);
            long disableTime = prefs.getLong("disable_request_time", 0);
            long currentTime = System.currentTimeMillis();

            WritableMap result = Arguments.createMap();
            result.putBoolean("isPending", isPending);

            if (isPending && disableTime > 0) {
                long remainingMs = disableTime - currentTime;

                if (remainingMs <= 0) {
                    // Time has elapsed, blocking can now be disabled
                    result.putBoolean("canDisableNow", true);
                    result.putDouble("remainingMinutes", 0);
                    result.putString("status", "ready_to_disable");
                } else {
                    // Still waiting
                    double remainingMinutes = remainingMs / (1000.0 * 60.0); // Convert to minutes
                    result.putBoolean("canDisableNow", false);
                    result.putDouble("remainingMinutes", remainingMinutes);
                    result.putString("status", "waiting");

                    // Format remaining time for display
                    long hours = remainingMs / (1000 * 60 * 60);
                    long minutes = (remainingMs % (1000 * 60 * 60)) / (1000 * 60);
                    result.putString("remainingTimeDisplay", hours + "h " + minutes + "m");
                }

                result.putDouble("disableTime", disableTime);
            } else {
                result.putBoolean("canDisableNow", false);
                result.putDouble("remainingMinutes", 0);
                result.putString("status", "no_request");
            }

            Log.d(TAG, "Disable status: " + result.toString());
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting disable status", e);
            promise.reject("GET_DISABLE_STATUS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void confirmDisableBlocking(Promise promise) {
        try {
            Log.d(TAG, "Confirming disable blocking");

            SharedPreferences prefs = reactContext.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
            boolean isPending = prefs.getBoolean("disable_request_pending", false);
            long disableTime = prefs.getLong("disable_request_time", 0);
            long currentTime = System.currentTimeMillis();

            if (!isPending) {
                promise.reject("NO_DISABLE_REQUEST", "No disable request is pending");
                return;
            }

            if (currentTime < disableTime) {
                long remainingMs = disableTime - currentTime;
                double remainingMinutes = remainingMs / (1000.0 * 60.0);
                promise.reject("DISABLE_NOT_READY",
                        "Must wait " + String.format("%.1f", remainingMinutes) + " more minutes");
                return;
            }

            // Time has elapsed, proceed with disabling
            // TODO: Implement VoltBlockingManager
            // For now, just return success to test the 2-hour delay system
            boolean success = true;

            // Clear the disable request
            SharedPreferences.Editor editor = prefs.edit();
            editor.remove("disable_request_time");
            editor.putBoolean("disable_request_pending", false);
            editor.apply();

            // Stop countdown notification service
            VoltCountdownService.stopCountdown(reactContext);

            Log.d(TAG, "Blocking disabled successfully after 2-hour delay");

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", success);
            result.putString("message", success ? "Blocking disabled successfully" : "Failed to disable blocking");

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error confirming disable blocking", e);
            promise.reject("CONFIRM_DISABLE_ERROR", e.getMessage());
        }
    }

    // ============ HELPER METHODS ============

    private boolean checkUsageStatsPermission() {
        try {
            Calendar calendar = Calendar.getInstance();
            long endTime = calendar.getTimeInMillis();
            calendar.add(Calendar.YEAR, -1);
            long startTime = calendar.getTimeInMillis();

            List<UsageStats> stats = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_YEARLY, startTime, endTime);

            return stats != null && !stats.isEmpty();
        } catch (Exception e) {
            Log.e(TAG, "Error checking usage stats permission", e);
            return false;
        }
    }

    private boolean isAccessibilityServiceEnabled() {
        try {
            // TODO: Replace with actual VoltAccessibilityService class name when
            // implemented
            String serviceName = reactContext.getPackageName() + "/com.volt.appblocking.VoltAccessibilityService";
            String enabledServices = Settings.Secure.getString(
                    reactContext.getContentResolver(),
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);

            if (enabledServices == null) {
                return false;
            }

            return enabledServices.contains(serviceName);
        } catch (Exception e) {
            Log.e(TAG, "Error checking accessibility service status", e);
            return false;
        }
    }

    private String getAppIconBase64(String packageName) {
        try {
            Drawable drawable = packageManager.getApplicationIcon(packageName);
            Bitmap bitmap = Bitmap.createBitmap(
                    drawable.getIntrinsicWidth(),
                    drawable.getIntrinsicHeight(),
                    Bitmap.Config.ARGB_8888);

            Canvas canvas = new Canvas(bitmap);
            drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
            drawable.draw(canvas);

            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream.toByteArray();

            return Base64.encodeToString(byteArray, Base64.DEFAULT);
        } catch (Exception e) {
            Log.w(TAG, "Could not get icon for " + packageName, e);
            return null;
        }
    }

    /**
     * Classify an app into categories for blocking purposes
     */
    private AppCategory classifyApp(String packageName, ApplicationInfo appInfo) {
        // Check if it's a critical system app (should never be blocked)
        if (CRITICAL_SYSTEM_APPS.contains(packageName)) {
            return AppCategory.SYSTEM_ESSENTIAL;
        }

        // Check if it's a commonly distracting system app
        if (DISTRACTING_SYSTEM_APPS.contains(packageName)) {
            return AppCategory.SYSTEM_DISTRACTING;
        }

        // Check if it's a utility system app
        if (UTILITY_SYSTEM_APPS.contains(packageName)) {
            return AppCategory.SYSTEM_UTILITY;
        }

        // Check if it's a system app
        boolean isSystemApp = (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;

        if (isSystemApp) {
            // For unknown system apps, classify based on package name patterns
            if (packageName.contains("browser") ||
                    packageName.contains("chrome") ||
                    packageName.contains("firefox") ||
                    packageName.contains("youtube") ||
                    packageName.contains("social") ||
                    packageName.contains("messaging") ||
                    packageName.contains("email") ||
                    packageName.contains("gallery") ||
                    packageName.contains("music") ||
                    packageName.contains("video")) {
                return AppCategory.SYSTEM_DISTRACTING;
            } else {
                return AppCategory.SYSTEM_UTILITY;
            }
        } else {
            // User-installed app
            return AppCategory.USER_APP;
        }
    }

    /**
     * Get display name for app category
     */
    private String getCategoryDisplayName(AppCategory category) {
        switch (category) {
            case USER_APP:
                return "User App";
            case SYSTEM_DISTRACTING:
                return "System App (Distracting)";
            case SYSTEM_ESSENTIAL:
                return "System App (Essential)";
            case SYSTEM_UTILITY:
                return "System App (Utility)";
            default:
                return "Unknown";
        }
    }

    // ============ NOTIFICATION METHODS ============

    @ReactMethod
    public void showBlockingNotification(String packageName, Promise promise) {
        try {
            VoltBlockingManager manager = VoltBlockingManager.getInstance(reactContext);
            manager.showBlockingNotification(packageName);
            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "Error showing blocking notification", e);
            promise.reject("SHOW_BLOCKING_NOTIFICATION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void showFocusSessionNotification(int duration, int remainingTime, Promise promise) {
        try {
            VoltBlockingManager manager = VoltBlockingManager.getInstance(reactContext);
            manager.showFocusSessionNotification(duration, remainingTime);
            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "Error showing focus session notification", e);
            promise.reject("SHOW_FOCUS_NOTIFICATION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void hideFocusSessionNotification(Promise promise) {
        try {
            VoltBlockingManager manager = VoltBlockingManager.getInstance(reactContext);
            manager.hideFocusSessionNotification();
            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "Error hiding focus session notification", e);
            promise.reject("HIDE_FOCUS_NOTIFICATION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startCountdownService(double endTimeMs, Promise promise) {
        try {
            long endTime = (long) endTimeMs;
            VoltCountdownService.startCountdown(reactContext, endTime);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error starting countdown service", e);
            promise.reject("START_COUNTDOWN_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopCountdownService(Promise promise) {
        try {
            VoltCountdownService.stopCountdown(reactContext);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping countdown service", e);
            promise.reject("STOP_COUNTDOWN_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isCountdownServiceRunning(Promise promise) {
        try {
            boolean isRunning = VoltCountdownService.isRunning(reactContext);
            promise.resolve(isRunning);
        } catch (Exception e) {
            Log.e(TAG, "Error checking countdown service status", e);
            promise.reject("COUNTDOWN_STATUS_ERROR", e.getMessage());
        }
    }
}