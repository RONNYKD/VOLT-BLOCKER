package com.volt.appblocking;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.app.ActivityManager;
import android.content.Context;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Accessibility service for app blocking
 * This service monitors app launches and blocks specified apps
 */
public class VoltAccessibilityService extends AccessibilityService {
    private static final String TAG = "VoltAccessibility";
    private static VoltAccessibilityService instance;
    private Set<String> blockedPackages = new HashSet<>();
    private Set<String> blockedWebsites = new HashSet<>();
    private boolean isBlockingActive = false;
    private boolean isWebsiteBlockingActive = false;
    private String lastDetectedPackage = "";
    private long lastBlockTime = 0;
    private static final long BLOCK_COOLDOWN_MS = 500; // Prevent rapid blocking
    
    // Performance optimization variables
    private String lastCheckedUrl = "";
    private long lastUrlCheckTime = 0;
    private static final long URL_CHECK_COOLDOWN_MS = 300; // Reduced debounce for faster response

    // Home package names for common launchers
    private static final Set<String> HOME_PACKAGES = new HashSet<>();
    static {
        HOME_PACKAGES.add("com.google.android.apps.nexuslauncher"); // Pixel Launcher
        HOME_PACKAGES.add("com.android.launcher3"); // AOSP Launcher
        HOME_PACKAGES.add("com.android.launcher2"); // Older Android Launcher
        HOME_PACKAGES.add("com.sec.android.app.launcher"); // Samsung Launcher
        HOME_PACKAGES.add("com.miui.home"); // Xiaomi Launcher
        HOME_PACKAGES.add("com.huawei.android.launcher"); // Huawei Launcher
        HOME_PACKAGES.add("com.oneplus.launcher"); // OnePlus Launcher
        HOME_PACKAGES.add("com.microsoft.launcher"); // Microsoft Launcher
        HOME_PACKAGES.add("com.teslacoilsw.launcher"); // Nova Launcher
        HOME_PACKAGES.add("com.actionlauncher.playstore"); // Action Launcher
        HOME_PACKAGES.add("com.lge.launcher2"); // LG Launcher
        HOME_PACKAGES.add("com.oppo.launcher"); // Oppo Launcher
        HOME_PACKAGES.add("com.vivo.launcher"); // Vivo Launcher
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) {
            return;
        }

        try {
            // Process both window state changes and content changes for better responsiveness
            int eventType = event.getEventType();
            if (eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || 
                eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
                
                String packageName = event.getPackageName() != null ? event.getPackageName().toString() : "";
                
                if (packageName.isEmpty()) {
                    return;
                }
                
                // Process app blocking if active
                if (isBlockingActive) {
                    handleAppBlocking(packageName);
                }
                
                // Process website blocking if active and it's a browser
                if (isWebsiteBlockingActive && VoltBrowserMonitor.isBrowserApp(packageName)) {
                    handleWebsiteBlocking(event, packageName);
                }
                

            }
        } catch (Exception e) {
            Log.e(TAG, "Error processing accessibility event", e);
        }
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted");
    }

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "Accessibility service connected");
        
        instance = this;
        
        // Configure accessibility service
        AccessibilityServiceInfo info = getServiceInfo();
        if (info == null) {
            info = new AccessibilityServiceInfo();
        }
        
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED | 
                          AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.notificationTimeout = 50; // Faster response time
        info.flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
        
        setServiceInfo(info);
    }

    @Override
    public boolean onUnbind(Intent intent) {
        Log.d(TAG, "Accessibility service unbound");
        instance = null;
        return super.onUnbind(intent);
    }

    /**
     * Handle app blocking logic
     */
    private void handleAppBlocking(String packageName) {
        try {
            // Skip if it's the same package we just detected (prevent multiple triggers)
            if (packageName.equals(lastDetectedPackage)) {
                return;
            }
            
            lastDetectedPackage = packageName;
            
            // Check if this is a blocked package
            if (blockedPackages.contains(packageName)) {
                long currentTime = System.currentTimeMillis();
                
                // Prevent too frequent blocking actions
                if (currentTime - lastBlockTime > BLOCK_COOLDOWN_MS) {
                    Log.d(TAG, "Blocked app detected: " + packageName);
                    blockApp(packageName);
                    lastBlockTime = currentTime;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling app blocking", e);
        }
    }

    /**
     * Handle website blocking logic
     */
    private void handleWebsiteBlocking(AccessibilityEvent event, String packageName) {
        try {
            checkAndBlockWebsite(event);
        } catch (Exception e) {
            Log.e(TAG, "Error handling website blocking", e);
        }
    }

    /**
     * Block an app by returning to home screen
     */
    private void blockApp(String packageName) {
        try {
            Log.d(TAG, "Blocking app: " + packageName);
            
            // Go to home screen
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(homeIntent);
            
            // TODO: Implement blocking notification
            Log.d(TAG, "App blocked: " + packageName);
        } catch (Exception e) {
            Log.e(TAG, "Error blocking app", e);
        }
    }

    /**
     * Check if current website should be blocked and block it if necessary
     */
    private void checkAndBlockWebsite(AccessibilityEvent event) {
        try {
            String packageName = event.getPackageName().toString();
            long currentTime = System.currentTimeMillis();
            
            // Performance optimization: debounce URL checking
            if (currentTime - lastUrlCheckTime < URL_CHECK_COOLDOWN_MS) {
                return;
            }
            
            Log.d(TAG, "Checking website in browser: " + packageName);
            
            // Get the root node to extract URL
            AccessibilityNodeInfo rootNode = getRootInActiveWindow();
            if (rootNode == null) {
                Log.w(TAG, "Cannot get root node for URL extraction");
                return;
            }
            
            // Extract URL from browser
            String url = VoltBrowserMonitor.extractUrlFromBrowser(rootNode, packageName);
            if (url == null || url.isEmpty()) {
                Log.d(TAG, "No URL extracted from browser");
                return;
            }
            
            lastUrlCheckTime = currentTime;
            Log.d(TAG, "Extracted URL: " + url);
            
            // Check if URL should be blocked
            if (VoltUrlMatcher.isUrlBlocked(url, blockedWebsites)) {
                // Always block if URL is blocked, but prevent too frequent blocking actions
                if (currentTime - lastBlockTime > BLOCK_COOLDOWN_MS) {
                    Log.d(TAG, "Blocked website detected: " + url);
                    blockWebsite(url, packageName);
                    lastBlockTime = currentTime;
                    lastCheckedUrl = url; // Only cache URL after successful blocking
                }
            } else {
                // Reset cached URL if current URL is not blocked
                lastCheckedUrl = "";
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error checking website for blocking", e);
        }
    }

    /**
     * Block a website by returning to home screen and showing notification
     */
    private void blockWebsite(String url, String browserPackage) {
        try {
            Log.d(TAG, "Blocking website: " + url);
            
            // Extract domain for notification
            String domain = VoltUrlMatcher.extractDomain(url);
            if (domain == null) {
                domain = url;
            }
            
            // Go to home screen
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(homeIntent);
            
            // TODO: Implement website blocking notification
            Log.d(TAG, "Website blocked: " + domain + " in " + browserPackage);
            
        } catch (Exception e) {
            Log.e(TAG, "Error blocking website", e);
        }
    }

    /**
     * Static methods for controlling the service from outside
     */
    public static boolean isServiceRunning() {
        return instance != null;
    }

    public static void setBlockedPackages(List<String> packages) {
        if (instance != null) {
            instance.blockedPackages.clear();
            if (packages != null) {
                instance.blockedPackages.addAll(packages);
            }
            Log.d(TAG, "Updated blocked packages: " + instance.blockedPackages.size());
        } else {
            Log.w(TAG, "Cannot set blocked packages - service not running");
        }
    }

    public static void setBlockingActive(boolean active) {
        if (instance != null) {
            instance.isBlockingActive = active;
            Log.d(TAG, "Blocking active: " + active);
        } else {
            Log.w(TAG, "Cannot set blocking active - service not running");
        }
    }

    public static boolean isBlockingActive() {
        return instance != null && instance.isBlockingActive;
    }

    public static Set<String> getBlockedPackages() {
        if (instance != null) {
            return new HashSet<>(instance.blockedPackages);
        }
        return new HashSet<>();
    }

    // ============ WEBSITE BLOCKING METHODS ============

    public static void setBlockedWebsites(Set<String> websites) {
        if (instance != null) {
            instance.blockedWebsites.clear();
            if (websites != null) {
                instance.blockedWebsites.addAll(websites);
            }
            Log.d(TAG, "Updated blocked websites: " + instance.blockedWebsites.size());
        } else {
            Log.w(TAG, "Cannot set blocked websites - service not running");
        }
    }

    public static void setWebsiteBlockingActive(boolean active) {
        if (instance != null) {
            instance.isWebsiteBlockingActive = active;
            Log.d(TAG, "Website blocking active: " + active);
        } else {
            Log.w(TAG, "Cannot set website blocking active - service not running");
        }
    }

    public static boolean isWebsiteBlockingActive() {
        return instance != null && instance.isWebsiteBlockingActive;
    }

    public static Set<String> getBlockedWebsites() {
        if (instance != null) {
            return new HashSet<>(instance.blockedWebsites);
        }
        return new HashSet<>();
    }
}