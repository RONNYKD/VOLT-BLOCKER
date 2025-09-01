
package com.volt;

import androidx.annotation.NonNull;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.util.Log;
import android.app.NotificationManager;
import android.app.NotificationChannel;
import android.app.Notification;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.volt.uninstallprotection.VoltDeviceAdminReceiver;
import com.volt.appblocking.VoltPersistentService;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;

public class VoltUninstallProtectionModule extends ReactContextBaseJavaModule {

    private static final String TAG = "VoltUninstallProtection";
    private static final String PREFS_NAME = "volt_protection_prefs";
    private static final String PREF_PASSWORD_HASH = "password_hash";
    private static final String PREF_PIN_HASH = "pin_hash";
    private static final String PREF_PROTECTION_ACTIVE = "protection_active";
    private static final String PREF_EMERGENCY_OVERRIDE_STATE = "emergency_override_state";
    private static final String PREF_EMERGENCY_OVERRIDE_REQUEST_TIME = "emergency_override_request_time";
    private static final String PREF_EMERGENCY_OVERRIDE_AVAILABLE_TIME = "emergency_override_available_time";

    // Override states
    private static final String OVERRIDE_STATE_NONE = "none";
    private static final String OVERRIDE_STATE_PENDING = "pending";
    private static final String OVERRIDE_STATE_AVAILABLE = "available";
    private static final String OVERRIDE_STATE_EXPIRED = "expired";

    // Timing constants
    private static final long OVERRIDE_DELAY_MS = 5 * 60 * 60 * 1000; // 5 hours delay
    private static final long OVERRIDE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

    private DevicePolicyManager devicePolicyManager;
    private ComponentName deviceAdminComponent;
    private SharedPreferences prefs;

    public VoltUninstallProtectionModule(ReactApplicationContext reactContext) {
        super(reactContext);

        devicePolicyManager = (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
        deviceAdminComponent = new ComponentName(reactContext, VoltDeviceAdminReceiver.class);
        prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        Log.d(TAG, "VoltUninstallProtectionModule initialized");
    }

    @Override
    @NonNull
    public String getName() {
        return "VoltUninstallProtection";
    }

    // ============ CORE PROTECTION METHODS ============

    @ReactMethod
    public void enableProtection(Promise promise) {
        try {
            Log.d(TAG, "Enabling uninstall protection...");

            WritableMap result = Arguments.createMap();

            // Check if device admin is active
            if (!isDeviceAdminActive()) {
                result.putBoolean("success", false);
                result.putString("message", "Device administrator privileges required");
                WritableArray errors = Arguments.createArray();
                errors.pushString("Device admin not active");
                result.putArray("errors", errors);
                promise.resolve(result);
                return;
            }

            // Enable protection
            prefs.edit().putBoolean(PREF_PROTECTION_ACTIVE, true).apply();
            
            // Start persistent service to maintain protection in background
            VoltPersistentService.startPersistentService(getReactApplicationContext());

            result.putBoolean("success", true);
            result.putString("message", "Uninstall protection enabled successfully");
            result.putArray("errors", Arguments.createArray());

            Log.d(TAG, "Uninstall protection enabled successfully with persistent service");
            promise.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to enable protection", e);
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", false);
            result.putString("message", "Failed to enable protection: " + e.getMessage());
            WritableArray errors = Arguments.createArray();
            errors.pushString(e.getMessage());
            result.putArray("errors", errors);
            promise.resolve(result);
        }
    }

    @ReactMethod
    public void disableProtection(String password, Promise promise) {
        try {
            Log.d(TAG, "Disabling uninstall protection with password verification...");

            // Verify password first
            String storedHash = prefs.getString(PREF_PASSWORD_HASH, null);
            if (storedHash == null) {
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", false);
                result.putString("message", "No protection password set");
                promise.resolve(result);
                return;
            }

            if (password == null || password.isEmpty()) {
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", false);
                result.putString("message", "Password required");
                promise.resolve(result);
                return;
            }

            String inputHash = hashString(password);
            if (inputHash == null) {
                Log.e(TAG, "Password verification failed: could not hash input password");
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", false);
                result.putString("message", "Password verification error");
                promise.resolve(result);
                return;
            }

            Log.d(TAG, "Stored hash length: " + storedHash.length() + ", Input hash length: " + inputHash.length());

            if (!storedHash.equals(inputHash)) {
                Log.d(TAG, "Password verification failed: hashes do not match");
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", false);
                result.putString("message", "Incorrect password");
                promise.resolve(result);
                return;
            }

            Log.d(TAG, "Password verification successful");

            // Password verified - disable protection
            prefs.edit().putBoolean(PREF_PROTECTION_ACTIVE, false).apply();

            Log.d(TAG, "Protection flag disabled successfully");

            // Try to remove device admin if possible
            boolean deviceAdminRemoved = false;
            if (isDeviceAdminActive()) {
                try {
                    devicePolicyManager.removeActiveAdmin(deviceAdminComponent);
                    deviceAdminRemoved = true;
                    Log.d(TAG, "Device admin removed successfully");
                } catch (Exception e) {
                    Log.w(TAG, "Could not remove device admin automatically: " + e.getMessage());
                    deviceAdminRemoved = false;
                }
            } else {
                deviceAdminRemoved = true; // Already not active
            }

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putBoolean("deviceAdminRemoved", deviceAdminRemoved);

            if (deviceAdminRemoved) {
                result.putString("message", "Uninstall protection disabled successfully. App can now be uninstalled.");
            } else {
                result.putString("message",
                        "Protection disabled, but device admin must be disabled manually in Android Settings → Security → Device Administrators.");
            }

            Log.d(TAG, "Uninstall protection disabled successfully. Device admin removed: " + deviceAdminRemoved);
            promise.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to disable protection", e);
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", false);
            result.putString("message", "Failed to disable protection: " + e.getMessage());
            promise.resolve(result);
        }
    }

    @ReactMethod
    public void isProtectionActive(Promise promise) {
        try {
            // Protection is active unless override is currently available
            String overrideState = getOverrideState();
            boolean isActive = prefs.getBoolean(PREF_PROTECTION_ACTIVE, false) &&
                    isDeviceAdminActive() &&
                    !OVERRIDE_STATE_AVAILABLE.equals(overrideState);

            Log.d(TAG, "Protection active: " + isActive + ", Override state: " + overrideState);
            promise.resolve(isActive);
        } catch (Exception e) {
            Log.e(TAG, "Failed to check protection status", e);
            promise.resolve(false);
        }
    }

    // ============ DEVICE ADMIN METHODS ============

    @ReactMethod
    public void requestDeviceAdmin(Promise promise) {
        try {
            Log.d(TAG, "Requesting device admin privileges...");

            if (isDeviceAdminActive()) {
                Log.d(TAG, "Device admin already active");
                promise.resolve(true);
                return;
            }

            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, deviceAdminComponent);
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    "VOLT needs device administrator privileges to prevent uninstallation during focus sessions.");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            getCurrentActivity().startActivity(intent);

            // Note: We can't immediately know the result, so we return true
            // The app should check isDeviceAdminActive() later
            promise.resolve(true);

        } catch (Exception e) {
            Log.e(TAG, "Failed to request device admin", e);
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void openDeviceAdminSettings(Promise promise) {
        try {
            Log.d(TAG, "Opening device admin settings...");

            Intent intent = new Intent(Settings.ACTION_SECURITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            // Try to open security settings first
            try {
                getCurrentActivity().startActivity(intent);
                promise.resolve(true);
                return;
            } catch (Exception e) {
                Log.w(TAG, "Failed to open security settings, trying device admin settings", e);
            }

            // Fallback: Try to open device admin settings directly
            try {
                intent = new Intent("android.app.action.DEVICE_ADMIN_SETTINGS");
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getCurrentActivity().startActivity(intent);
                promise.resolve(true);
                return;
            } catch (Exception e) {
                Log.w(TAG, "Failed to open device admin settings, trying general settings", e);
            }

            // Final fallback: Open general settings
            intent = new Intent(Settings.ACTION_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getCurrentActivity().startActivity(intent);
            promise.resolve(true);

        } catch (Exception e) {
            Log.e(TAG, "Failed to open device admin settings", e);
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void openDeviceAdminSettingsForDisable(Promise promise) {
        try {
            Log.d(TAG, "Opening device admin settings for manual disable...");

            // Create an alert dialog with instructions
            getCurrentActivity().runOnUiThread(() -> {
                android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(getCurrentActivity());
                builder.setTitle("Manual Device Admin Disable");
                builder.setMessage("To manually disable device admin:\n\n" +
                        "1. Go to Settings → Security\n" +
                        "2. Find 'Device Administrators'\n" +
                        "3. Locate 'VOLT' and tap to disable\n\n" +
                        "This will open the settings for you.");
                builder.setPositiveButton("Open Settings", (dialog, which) -> {
                    openDeviceAdminSettings(promise);
                });
                builder.setNegativeButton("Cancel", (dialog, which) -> {
                    promise.resolve(false);
                });
                builder.show();
            });

        } catch (Exception e) {
            Log.e(TAG, "Failed to show device admin disable instructions", e);
            openDeviceAdminSettings(promise);
        }
    }

    private boolean isDeviceAdminActive() {
        return devicePolicyManager != null &&
                devicePolicyManager.isAdminActive(deviceAdminComponent);
    }

    @ReactMethod
    public void isDeviceAdminEnabled(Promise promise) {
        try {
            boolean isEnabled = isDeviceAdminActive();
            Log.d(TAG, "Device admin enabled: " + isEnabled);
            promise.resolve(isEnabled);
        } catch (Exception e) {
            Log.e(TAG, "Failed to check device admin status", e);
            promise.resolve(false);
        }
    }

    // ============ PERMISSION METHODS ============

    @ReactMethod
    public void checkPermissions(Promise promise) {
        try {
            WritableArray permissions = Arguments.createArray();

            // Device Admin Permission
            WritableMap deviceAdminPerm = Arguments.createMap();
            deviceAdminPerm.putString("name", "Device Administrator");
            deviceAdminPerm.putString("type", "device_admin");
            deviceAdminPerm.putBoolean("granted", isDeviceAdminActive());
            deviceAdminPerm.putBoolean("required", true);
            deviceAdminPerm.putString("description", "Required to prevent app uninstallation");
            permissions.pushMap(deviceAdminPerm);

            // Accessibility Service Permission (for advanced protection)
            WritableMap accessibilityPerm = Arguments.createMap();
            accessibilityPerm.putString("name", "Accessibility Service");
            accessibilityPerm.putString("type", "accessibility");
            accessibilityPerm.putBoolean("granted", isAccessibilityServiceEnabled());
            accessibilityPerm.putBoolean("required", false);
            accessibilityPerm.putString("description", "Enhanced protection against uninstall attempts");
            permissions.pushMap(accessibilityPerm);

            promise.resolve(permissions);

        } catch (Exception e) {
            Log.e(TAG, "Failed to check permissions", e);
            promise.resolve(Arguments.createArray());
        }
    }

    private boolean isAccessibilityServiceEnabled() {
        // Check if accessibility service is enabled
        // This is a simplified check - in a real implementation you'd check the
        // specific service
        try {
            int accessibilityEnabled = Settings.Secure.getInt(
                    getReactApplicationContext().getContentResolver(),
                    Settings.Secure.ACCESSIBILITY_ENABLED, 0);
            return accessibilityEnabled == 1;
        } catch (Exception e) {
            return false;
        }
    }

    // ============ AUTHENTICATION METHODS ============

    @ReactMethod
    public void setupProtectionPassword(String password, Promise promise) {
        try {
            String hashedPassword = hashString(password);
            prefs.edit().putString(PREF_PASSWORD_HASH, hashedPassword).apply();

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "Protection password set successfully");

            Log.d(TAG, "Protection password set successfully");
            promise.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to setup protection password", e);
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", false);
            result.putString("message", "Failed to set protection password");
            promise.resolve(result);
        }
    }

    @ReactMethod
    public void verifyProtectionPassword(String password, Promise promise) {
        try {
            String storedHash = prefs.getString(PREF_PASSWORD_HASH, null);
            if (storedHash == null) {
                promise.resolve(false);
                return;
            }

            String inputHash = hashString(password);
            boolean isValid = storedHash.equals(inputHash);

            Log.d(TAG, "Password verification: " + (isValid ? "success" : "failed"));
            promise.resolve(isValid);

        } catch (Exception e) {
            Log.e(TAG, "Failed to verify protection password", e);
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void hasProtectionPassword(Promise promise) {
        try {
            String storedHash = prefs.getString(PREF_PASSWORD_HASH, null);
            promise.resolve(storedHash != null);
        } catch (Exception e) {
            Log.e(TAG, "Failed to check protection password", e);
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void setupPIN(String pin, Promise promise) {
        try {
            String hashedPIN = hashString(pin);
            prefs.edit().putString(PREF_PIN_HASH, hashedPIN).apply();

            Log.d(TAG, "PIN set successfully");
            promise.resolve(true);

        } catch (Exception e) {
            Log.e(TAG, "Failed to setup PIN", e);
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void authenticateWithPIN(String pin, Promise promise) {
        try {
            String storedHash = prefs.getString(PREF_PIN_HASH, null);
            if (storedHash == null) {
                promise.resolve(false);
                return;
            }

            String inputHash = hashString(pin);
            boolean isValid = storedHash.equals(inputHash);

            Log.d(TAG, "PIN verification: " + (isValid ? "success" : "failed"));
            promise.resolve(isValid);

        } catch (Exception e) {
            Log.e(TAG, "Failed to verify PIN", e);
            promise.resolve(false);
        }
    }
    // ============ STATUS METHODS ============

    @ReactMethod
    public void getProtectionStatus(Promise promise) {
        try {
            WritableMap status = Arguments.createMap();

            String overrideState = getOverrideState();
            boolean isOverrideAvailable = OVERRIDE_STATE_AVAILABLE.equals(overrideState);
            boolean isActive = prefs.getBoolean(PREF_PROTECTION_ACTIVE, false) && isDeviceAdminActive()
                    && !isOverrideAvailable;

            status.putBoolean("isActive", isActive);

            // Protection layers status
            WritableMap layers = Arguments.createMap();

            // Device Admin layer
            WritableMap deviceAdmin = Arguments.createMap();
            deviceAdmin.putBoolean("enabled", isDeviceAdminActive());
            deviceAdmin.putBoolean("healthy", isDeviceAdminActive());
            deviceAdmin.putDouble("lastCheck", new Date().getTime());
            layers.putMap("deviceAdmin", deviceAdmin);

            // Package Monitor layer (simplified)
            WritableMap packageMonitor = Arguments.createMap();
            packageMonitor.putBoolean("enabled", isActive);
            packageMonitor.putBoolean("healthy", isActive);
            packageMonitor.putDouble("lastCheck", new Date().getTime());
            layers.putMap("packageMonitor", packageMonitor);

            // Password Auth layer
            WritableMap passwordAuth = Arguments.createMap();
            boolean hasPassword = prefs.getString(PREF_PASSWORD_HASH, null) != null;
            passwordAuth.putBoolean("enabled", hasPassword);
            passwordAuth.putBoolean("healthy", hasPassword);
            passwordAuth.putDouble("lastCheck", new Date().getTime());
            layers.putMap("passwordAuth", passwordAuth);

            // Accessibility Service layer
            WritableMap accessibilityService = Arguments.createMap();
            boolean accessibilityEnabled = isAccessibilityServiceEnabled();
            accessibilityService.putBoolean("enabled", accessibilityEnabled);
            accessibilityService.putBoolean("healthy", accessibilityEnabled);
            accessibilityService.putDouble("lastCheck", new Date().getTime());
            layers.putMap("accessibilityService", accessibilityService);

            status.putMap("layers", layers);
            status.putDouble("lastHealthCheck", new Date().getTime());
            status.putBoolean("emergencyOverrideActive", !OVERRIDE_STATE_NONE.equals(overrideState));
            status.putBoolean("focusSessionEnforced", isActive);

            // Emergency override details
            if (!OVERRIDE_STATE_NONE.equals(overrideState)) {
                WritableMap overrideInfo = Arguments.createMap();
                long remainingTime = getOverrideRemainingTime();

                overrideInfo.putString("state", overrideState);
                overrideInfo.putBoolean("isPending", OVERRIDE_STATE_PENDING.equals(overrideState));
                overrideInfo.putBoolean("isAvailable", OVERRIDE_STATE_AVAILABLE.equals(overrideState));
                overrideInfo.putBoolean("isExpired", OVERRIDE_STATE_EXPIRED.equals(overrideState));
                overrideInfo.putLong("remainingTimeMs", remainingTime);
                overrideInfo.putInt("remainingHours", (int) Math.ceil(remainingTime / (60.0 * 60.0 * 1000.0)));
                overrideInfo.putInt("remainingMinutes", (int) Math.ceil(remainingTime / (60.0 * 1000.0)));
                overrideInfo.putLong("requestTime", prefs.getLong(PREF_EMERGENCY_OVERRIDE_REQUEST_TIME, 0));
                overrideInfo.putLong("availableTime", getOverrideAvailableTime());
                overrideInfo.putLong("expirationTime", getOverrideExpirationTime());

                status.putMap("emergencyOverride", overrideInfo);
            }

            promise.resolve(status);

        } catch (Exception e) {
            Log.e(TAG, "Failed to get protection status", e);
            promise.reject("GET_STATUS_ERROR", "Failed to get protection status", e);
        }
    }
    
    @ReactMethod
    public void requestBatteryOptimizationExemption(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            String packageName = context.getPackageName();
            
            if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                Intent intent = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(android.net.Uri.parse("package:" + packageName));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", true);
                result.putString("message", "Battery optimization exemption requested");
                promise.resolve(result);
            } else {
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", true);
                result.putString("message", "Already exempt from battery optimization");
                promise.resolve(result);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error requesting battery optimization exemption", e);
            promise.reject("BATTERY_OPT_ERROR", "Failed to request battery optimization exemption: " + e.getMessage());
        }
    }

    @ReactMethod
    public void checkBatteryOptimizationStatus(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            String packageName = context.getPackageName();
            
            boolean isIgnoring = powerManager.isIgnoringBatteryOptimizations(packageName);
            
            WritableMap result = Arguments.createMap();
            result.putBoolean("isExempt", isIgnoring);
            result.putString("status", isIgnoring ? "exempt" : "not_exempt");
            result.putString("message", isIgnoring ? 
                "App is exempt from battery optimization" : 
                "App is subject to battery optimization - may affect background operation");
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error checking battery optimization status", e);
            promise.reject("BATTERY_STATUS_ERROR", "Failed to check battery optimization status: " + e.getMessage());
        }
    }

    @ReactMethod
    public void requestAutoStartPermission(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            String manufacturer = android.os.Build.MANUFACTURER.toLowerCase();
            
            Intent intent = null;
            String message = "Auto-start settings opened for " + manufacturer;
            
            // Handle different OEM auto-start settings
            switch (manufacturer) {
                case "xiaomi":
                    intent = new Intent("miui.intent.action.APP_PERM_EDITOR");
                    intent.setClassName("com.miui.securitycenter", 
                        "com.miui.permcenter.autostart.AutoStartManagementActivity");
                    message = "Xiaomi auto-start settings opened. Please enable auto-start for VOLT.";
                    break;
                case "huawei":
                    intent = new Intent();
                    intent.setClassName("com.huawei.systemmanager", 
                        "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity");
                    message = "Huawei startup manager opened. Please enable auto-start for VOLT.";
                    break;
                case "oppo":
                    intent = new Intent();
                    intent.setClassName("com.coloros.safecenter", 
                        "com.coloros.safecenter.permission.startup.StartupAppListActivity");
                    message = "OPPO startup manager opened. Please enable auto-start for VOLT.";
                    break;
                case "vivo":
                    intent = new Intent();
                    intent.setClassName("com.vivo.permissionmanager", 
                        "com.vivo.permissionmanager.activity.BgStartUpManagerActivity");
                    message = "Vivo background startup opened. Please enable auto-start for VOLT.";
                    break;
                case "samsung":
                    intent = new Intent();
                    intent.setClassName("com.samsung.android.lool", 
                        "com.samsung.android.sm.ui.battery.BatteryActivity");
                    message = "Samsung battery settings opened. Please disable battery optimization for VOLT.";
                    break;
                default:
                    // Generic approach
                    intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(android.net.Uri.parse("package:" + context.getPackageName()));
                    message = "App settings opened. Please check battery and auto-start settings.";
                    break;
            }
            
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", true);
                result.putString("message", message);
                result.putString("manufacturer", manufacturer);
                promise.resolve(result);
            } else {
                promise.reject("AUTOSTART_ERROR", "Could not determine auto-start settings for this device");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error opening auto-start settings", e);
            // Fallback to generic settings
            try {
                Context context = getReactApplicationContext();
                Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", true);
                result.putString("message", "App settings opened. Please check battery optimization settings.");
                promise.resolve(result);
            } catch (Exception fallbackError) {
                promise.reject("AUTOSTART_ERROR", "Failed to open auto-start settings: " + e.getMessage());
            }
        }
    }

    // ============ UTILITY METHODS ============

    private String hashString(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();

            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }

            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            Log.e(TAG, "SHA-256 algorithm not available", e);
            return null;
        }
    }

    // ============ NOTIFICATION METHODS ============

    @ReactMethod
    public void showFocusSessionNotification(int duration, int remainingTime, Promise promise) {
        try {
            Log.d(TAG, "Showing focus session notification: " + duration + " minutes, " + remainingTime
                    + " seconds remaining");

            // Create notification channel if needed (Android 8.0+)
            createNotificationChannel();

            // Build notification
            android.app.NotificationManager notificationManager = (android.app.NotificationManager) getReactApplicationContext()
                    .getSystemService(Context.NOTIFICATION_SERVICE);

            if (notificationManager != null) {
                android.app.Notification.Builder builder;

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    builder = new android.app.Notification.Builder(getReactApplicationContext(), "volt_focus_session");
                } else {
                    builder = new android.app.Notification.Builder(getReactApplicationContext());
                }

                int remainingMinutes = (int) Math.ceil(remainingTime / 60.0);
                String timeText = remainingMinutes > 0 ? remainingMinutes + " min remaining" : "Session ending...";

                android.app.Notification notification = builder
                        .setContentTitle("VOLT Focus Session Active")
                        .setContentText(timeText)
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setOngoing(true)
                        .setPriority(android.app.Notification.PRIORITY_LOW)
                        .build();

                notificationManager.notify(1001, notification);
                Log.d(TAG, "Focus session notification shown successfully");
            }

            promise.resolve(null);

        } catch (Exception e) {
            Log.e(TAG, "Failed to show focus session notification", e);
            promise.reject("NOTIFICATION_ERROR", "Failed to show notification", e);
        }
    }

    @ReactMethod
    public void hideFocusSessionNotification(Promise promise) {
        try {
            Log.d(TAG, "Hiding focus session notification");

            android.app.NotificationManager notificationManager = (android.app.NotificationManager) getReactApplicationContext()
                    .getSystemService(Context.NOTIFICATION_SERVICE);

            if (notificationManager != null) {
                notificationManager.cancel(1001);
                Log.d(TAG, "Focus session notification hidden successfully");
            }

            promise.resolve(null);

        } catch (Exception e) {
            Log.e(TAG, "Failed to hide focus session notification", e);
            promise.reject("NOTIFICATION_ERROR", "Failed to hide notification", e);
        }
    }

    @ReactMethod
    public void showSessionStartNotification(Promise promise) {
        try {
            Log.d(TAG, "Showing session start notification");

            createNotificationChannel();

            android.app.NotificationManager notificationManager = (android.app.NotificationManager) getReactApplicationContext()
                    .getSystemService(Context.NOTIFICATION_SERVICE);

            if (notificationManager != null) {
                android.app.Notification.Builder builder;

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    builder = new android.app.Notification.Builder(getReactApplicationContext(), "volt_session_events");
                } else {
                    builder = new android.app.Notification.Builder(getReactApplicationContext());
                }

                android.app.Notification notification = builder
                        .setContentTitle("VOLT Focus Session Started")
                        .setContentText("Your focus session has begun. Stay focused!")
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setAutoCancel(true)
                        .setPriority(android.app.Notification.PRIORITY_DEFAULT)
                        .build();

                notificationManager.notify(1002, notification);
                Log.d(TAG, "Session start notification shown successfully");
            }

            promise.resolve(null);

        } catch (Exception e) {
            Log.e(TAG, "Failed to show session start notification", e);
            promise.reject("NOTIFICATION_ERROR", "Failed to show notification", e);
        }
    }

    @ReactMethod
    public void showSessionEndNotification(boolean completed, Promise promise) {
        try {
            Log.d(TAG, "Showing session end notification: completed=" + completed);

            createNotificationChannel();

            android.app.NotificationManager notificationManager = (android.app.NotificationManager) getReactApplicationContext()
                    .getSystemService(Context.NOTIFICATION_SERVICE);

            if (notificationManager != null) {
                android.app.Notification.Builder builder;

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    builder = new android.app.Notification.Builder(getReactApplicationContext(), "volt_session_events");
                } else {
                    builder = new android.app.Notification.Builder(getReactApplicationContext());
                }

                String title = completed ? "Focus Session Completed!" : "Focus Session Ended";
                String text = completed ? "Great job! You completed your focus session."
                        : "Your focus session has ended.";

                android.app.Notification notification = builder
                        .setContentTitle(title)
                        .setContentText(text)
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setAutoCancel(true)
                        .setPriority(android.app.Notification.PRIORITY_DEFAULT)
                        .build();

                notificationManager.notify(1003, notification);
                Log.d(TAG, "Session end notification shown successfully");
            }

            promise.resolve(null);

        } catch (Exception e) {
            Log.e(TAG, "Failed to show session end notification", e);
            promise.reject("NOTIFICATION_ERROR", "Failed to show notification", e);
        }
    }

    private void createNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            android.app.NotificationManager notificationManager = (android.app.NotificationManager) getReactApplicationContext()
                    .getSystemService(Context.NOTIFICATION_SERVICE);

            if (notificationManager != null) {
                // Focus session channel
                android.app.NotificationChannel focusChannel = new android.app.NotificationChannel(
                        "volt_focus_session",
                        "Focus Session",
                        android.app.NotificationManager.IMPORTANCE_LOW);
                focusChannel.setDescription("Ongoing focus session notifications");
                focusChannel.setShowBadge(false);
                notificationManager.createNotificationChannel(focusChannel);

                // Session events channel
                android.app.NotificationChannel eventsChannel = new android.app.NotificationChannel(
                        "volt_session_events",
                        "Session Events",
                        android.app.NotificationManager.IMPORTANCE_DEFAULT);
                eventsChannel.setDescription("Session start and end notifications");
                notificationManager.createNotificationChannel(eventsChannel);

                Log.d(TAG, "Notification channels created");
            }
        }
    }

    // ============ EMERGENCY OVERRIDE METHODS ============

    @ReactMethod
    public void requestEmergencyOverride(Promise promise) {
        try {
            Log.d(TAG, "Emergency override requested");

            // Check if protection is active
            if (!prefs.getBoolean(PREF_PROTECTION_ACTIVE, false)) {
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", false);
                result.putString("message", "Protection is not currently active");
                promise.resolve(result);
                return;
            }

            String currentState = getOverrideState();

            // Check current override state
            if (OVERRIDE_STATE_PENDING.equals(currentState)) {
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", false);
                result.putString("message", "Override request is already pending");
                result.putLong("availableAt", getOverrideAvailableTime());
                promise.resolve(result);
                return;
            }

            if (OVERRIDE_STATE_AVAILABLE.equals(currentState)) {
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", false);
                result.putString("message", "Override is already available");
                result.putLong("expiresAt", getOverrideExpirationTime());
                promise.resolve(result);
                return;
            }

            // Start override request (5-hour delay)
            long currentTime = System.currentTimeMillis();
            long availableTime = currentTime + OVERRIDE_DELAY_MS;

            prefs.edit()
                    .putString(PREF_EMERGENCY_OVERRIDE_STATE, OVERRIDE_STATE_PENDING)
                    .putLong(PREF_EMERGENCY_OVERRIDE_REQUEST_TIME, currentTime)
                    .putLong(PREF_EMERGENCY_OVERRIDE_AVAILABLE_TIME, availableTime)
                    .apply();

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "Emergency override requested. Protection will remain active for 5 hours.");
            result.putString("state", OVERRIDE_STATE_PENDING);
            result.putLong("requestTime", currentTime);
            result.putLong("availableAt", availableTime);
            result.putLong("delayMs", OVERRIDE_DELAY_MS);

            Log.d(TAG, "Emergency override request started - available at: " + new Date(availableTime));
            promise.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to request emergency override", e);
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", false);
            result.putString("message", "Failed to request emergency override: " + e.getMessage());
            promise.resolve(result);
        }
    }

    @ReactMethod
    public void getEmergencyOverrideStatus(Promise promise) {
        try {
            WritableMap status = Arguments.createMap();

            String state = getOverrideState();
            long remainingTime = getOverrideRemainingTime();
            long requestTime = prefs.getLong(PREF_EMERGENCY_OVERRIDE_REQUEST_TIME, 0);
            long availableTime = getOverrideAvailableTime();
            long expirationTime = getOverrideExpirationTime();

            status.putString("state", state);
            status.putBoolean("isActive", !OVERRIDE_STATE_NONE.equals(state));
            status.putBoolean("isPending", OVERRIDE_STATE_PENDING.equals(state));
            status.putBoolean("isAvailable", OVERRIDE_STATE_AVAILABLE.equals(state));
            status.putBoolean("isExpired", OVERRIDE_STATE_EXPIRED.equals(state));

            status.putLong("requestTime", requestTime);
            status.putLong("availableTime", availableTime);
            status.putLong("expirationTime", expirationTime);
            status.putLong("remainingTimeMs", remainingTime);

            // Human-readable time
            if (remainingTime > 0) {
                int hours = (int) (remainingTime / (60 * 60 * 1000));
                int minutes = (int) ((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
                status.putInt("remainingHours", hours);
                status.putInt("remainingMinutes", minutes);

                if (OVERRIDE_STATE_PENDING.equals(state)) {
                    status.putString("message", "Override will be available in " + hours + "h " + minutes + "m");
                } else if (OVERRIDE_STATE_AVAILABLE.equals(state)) {
                    status.putString("message", "Override available for " + minutes + " more minutes");
                }
            } else {
                status.putInt("remainingHours", 0);
                status.putInt("remainingMinutes", 0);

                if (OVERRIDE_STATE_EXPIRED.equals(state)) {
                    status.putString("message", "Override has expired. Protection is active again.");
                } else {
                    status.putString("message", "No active override");
                }
            }

            promise.resolve(status);

        } catch (Exception e) {
            Log.e(TAG, "Failed to get emergency override status", e);
            promise.reject("OVERRIDE_STATUS_ERROR", "Failed to get override status", e);
        }
    }

    @ReactMethod
    public void cancelEmergencyOverride(Promise promise) {
        try {
            Log.d(TAG, "Canceling emergency override");

            String state = getOverrideState();
            if (OVERRIDE_STATE_NONE.equals(state)) {
                WritableMap result = Arguments.createMap();
                result.putBoolean("success", false);
                result.putString("message", "No active emergency override to cancel");
                promise.resolve(result);
                return;
            }

            // Clear all override settings
            prefs.edit()
                    .putString(PREF_EMERGENCY_OVERRIDE_STATE, OVERRIDE_STATE_NONE)
                    .remove(PREF_EMERGENCY_OVERRIDE_REQUEST_TIME)
                    .remove(PREF_EMERGENCY_OVERRIDE_AVAILABLE_TIME)
                    .apply();

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "Emergency override canceled. Protection is now active again.");

            Log.d(TAG, "Emergency override canceled successfully");
            promise.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel emergency override", e);
            WritableMap result = Arguments.createMap();
            result.putBoolean("success", false);
            result.putString("message", "Failed to cancel emergency override: " + e.getMessage());
            promise.resolve(result);
        }
    }

    private String getOverrideState() {
        try {
            String state = prefs.getString(PREF_EMERGENCY_OVERRIDE_STATE, OVERRIDE_STATE_NONE);

            if (OVERRIDE_STATE_NONE.equals(state)) {
                return OVERRIDE_STATE_NONE;
            }

            long currentTime = System.currentTimeMillis();
            long requestTime = prefs.getLong(PREF_EMERGENCY_OVERRIDE_REQUEST_TIME, 0);
            long availableTime = prefs.getLong(PREF_EMERGENCY_OVERRIDE_AVAILABLE_TIME, 0);

            if (OVERRIDE_STATE_PENDING.equals(state)) {
                // Check if 5 hours have passed
                if (currentTime >= availableTime) {
                    // Override is now available
                    prefs.edit()
                            .putString(PREF_EMERGENCY_OVERRIDE_STATE, OVERRIDE_STATE_AVAILABLE)
                            .apply();

                    Log.d(TAG, "Override state changed from PENDING to AVAILABLE");
                    return OVERRIDE_STATE_AVAILABLE;
                }
                return OVERRIDE_STATE_PENDING;
            }

            if (OVERRIDE_STATE_AVAILABLE.equals(state)) {
                // Check if 15-minute window has expired
                long expirationTime = availableTime + OVERRIDE_WINDOW_MS;
                if (currentTime >= expirationTime) {
                    // Override expired
                    prefs.edit()
                            .putString(PREF_EMERGENCY_OVERRIDE_STATE, OVERRIDE_STATE_EXPIRED)
                            .apply();

                    Log.d(TAG, "Override state changed from AVAILABLE to EXPIRED");

                    // Send expiration notification
                    sendOverrideExpirationNotification();

                    return OVERRIDE_STATE_EXPIRED;
                }
                return OVERRIDE_STATE_AVAILABLE;
            }

            if (OVERRIDE_STATE_EXPIRED.equals(state)) {
                // Clean up expired state after some time
                long cleanupTime = availableTime + OVERRIDE_WINDOW_MS + (60 * 60 * 1000); // 1 hour after expiration
                if (currentTime >= cleanupTime) {
                    prefs.edit()
                            .putString(PREF_EMERGENCY_OVERRIDE_STATE, OVERRIDE_STATE_NONE)
                            .remove(PREF_EMERGENCY_OVERRIDE_REQUEST_TIME)
                            .remove(PREF_EMERGENCY_OVERRIDE_AVAILABLE_TIME)
                            .apply();

                    Log.d(TAG, "Override state cleaned up");
                    return OVERRIDE_STATE_NONE;
                }
                return OVERRIDE_STATE_EXPIRED;
            }

            return OVERRIDE_STATE_NONE;

        } catch (Exception e) {
            Log.e(TAG, "Error getting override state", e);
            return OVERRIDE_STATE_NONE;
        }
    }

    private long getOverrideAvailableTime() {
        return prefs.getLong(PREF_EMERGENCY_OVERRIDE_AVAILABLE_TIME, 0);
    }

    private long getOverrideExpirationTime() {
        long availableTime = prefs.getLong(PREF_EMERGENCY_OVERRIDE_AVAILABLE_TIME, 0);
        return availableTime + OVERRIDE_WINDOW_MS;
    }

    private long getOverrideRemainingTime() {
        String state = getOverrideState();
        long currentTime = System.currentTimeMillis();

        if (OVERRIDE_STATE_PENDING.equals(state)) {
            // Time until available
            long availableTime = getOverrideAvailableTime();
            return Math.max(0, availableTime - currentTime);
        }

        if (OVERRIDE_STATE_AVAILABLE.equals(state)) {
            // Time until expiration
            long expirationTime = getOverrideExpirationTime();
            return Math.max(0, expirationTime - currentTime);
        }

        return 0;
    }

    private void sendOverrideExpirationNotification() {
        try {
            Log.d(TAG, "Sending override expiration notification");

            createNotificationChannel();

            android.app.NotificationManager notificationManager = (android.app.NotificationManager) getReactApplicationContext()
                    .getSystemService(Context.NOTIFICATION_SERVICE);

            if (notificationManager != null) {
                android.app.Notification.Builder builder;

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    builder = new android.app.Notification.Builder(getReactApplicationContext(), "volt_session_events");
                } else {
                    builder = new android.app.Notification.Builder(getReactApplicationContext());
                }

                android.app.Notification notification = builder
                        .setContentTitle("VOLT Emergency Override Expired")
                        .setContentText("The 15-minute override window has expired. Protection is now active again.")
                        .setSmallIcon(android.R.drawable.ic_dialog_alert)
                        .setAutoCancel(true)
                        .setPriority(android.app.Notification.PRIORITY_HIGH)
                        .build();

                notificationManager.notify(1004, notification);
                Log.d(TAG, "Override expiration notification sent successfully");
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed to send override expiration notification", e);
        }
    }

    @ReactMethod
    public void canDisableWithoutPassword(Promise promise) {
        try {
            String state = getOverrideState();
            boolean canDisable = OVERRIDE_STATE_AVAILABLE.equals(state);

            WritableMap result = Arguments.createMap();
            result.putBoolean("canDisable", canDisable);
            result.putString("overrideState", state);

            if (canDisable) {
                long remainingTime = getOverrideRemainingTime();
                result.putLong("remainingTimeMs", remainingTime);
                result.putString("message", "Override is available. You can disable protection without password.");
            } else if (OVERRIDE_STATE_PENDING.equals(state)) {
                long remainingTime = getOverrideRemainingTime();
                result.putLong("remainingTimeMs", remainingTime);
                result.putString("message", "Override is pending. Protection remains active.");
            } else {
                result.putString("message", "Password required to disable protection.");
            }

            promise.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Failed to check disable permission", e);
            promise.reject("CHECK_DISABLE_ERROR", "Failed to check disable permission", e);
        }
    }

    @ReactMethod
    public void debugPasswordHash(String password, Promise promise) {
        try {
            String hash = hashString(password);
            String storedHash = prefs.getString(PREF_PASSWORD_HASH, null);

            WritableMap result = Arguments.createMap();
            result.putString("inputPassword", password);
            result.putString("inputHash", hash != null ? hash : "null");
            result.putString("storedHash", storedHash != null ? storedHash : "null");
            result.putBoolean("matches", hash != null && storedHash != null && storedHash.equals(hash));
            result.putInt("inputHashLength", hash != null ? hash.length() : 0);
            result.putInt("storedHashLength", storedHash != null ? storedHash.length() : 0);

            Log.d(TAG, "Password debug - Input: " + password + ", Hash: " + hash + ", Stored: " + storedHash);

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to debug password hash", e);
            promise.reject("DEBUG_ERROR", "Failed to debug password hash", e);
        }
    }

    @ReactMethod
    public void test(Promise promise) {
        promise.resolve("VoltUninstallProtection module is working! Device admin active: " + isDeviceAdminActive());
    }
}