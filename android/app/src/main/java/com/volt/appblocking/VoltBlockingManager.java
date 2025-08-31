package com.volt.appblocking;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import com.volt.MainActivity;
import com.volt.R;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Manager class for app blocking functionality
 * Coordinates between the accessibility service and the React Native module
 */
public class VoltBlockingManager {
    private static final String TAG = "VoltBlockingManager";
    private static final String NOTIFICATION_CHANNEL_ID = "volt_blocking_channel";
    private static final int BLOCKING_NOTIFICATION_ID = 1001;
    
    private static VoltBlockingManager instance;
    private Context context;
    private NotificationManager notificationManager;
    private Set<String> blockedPackages = new HashSet<>();
    private boolean isBlockingActive = false;
    private long sessionStartTime = 0;
    private int sessionDuration = 0; // in minutes

    private VoltBlockingManager(Context context) {
        this.context = context.getApplicationContext();
        this.notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }

    public static synchronized VoltBlockingManager getInstance(Context context) {
        if (instance == null) {
            instance = new VoltBlockingManager(context);
        }
        return instance;
    }

    public static VoltBlockingManager getInstance() {
        if (instance == null) {
            throw new IllegalStateException("VoltBlockingManager not initialized. Call getInstance(Context) first.");
        }
        return instance;
    }

    /**
     * Start blocking with specified packages
     */
    public boolean startBlocking(List<String> packageNames) {
        try {
            Log.d(TAG, "Starting blocking for " + packageNames.size() + " packages");
            
            blockedPackages.clear();
            if (packageNames != null) {
                blockedPackages.addAll(packageNames);
            }
            
            isBlockingActive = true;
            
            // Update accessibility service
            VoltAccessibilityService.setBlockedPackages(new ArrayList<>(blockedPackages));
            VoltAccessibilityService.setBlockingActive(true);
            
            // Show persistent notification
            showPersistentNotification();
            
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error starting blocking", e);
            return false;
        }
    }

    /**
     * Stop all blocking
     */
    public boolean stopBlocking() {
        try {
            Log.d(TAG, "Stopping blocking");
            
            isBlockingActive = false;
            blockedPackages.clear();
            
            // Update accessibility service
            VoltAccessibilityService.setBlockingActive(false);
            VoltAccessibilityService.setBlockedPackages(new ArrayList<>());
            
            // Remove notifications
            notificationManager.cancel(BLOCKING_NOTIFICATION_ID);
            
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error stopping blocking", e);
            return false;
        }
    }

    /**
     * Start a focus session
     */
    public boolean startFocusSession(int durationMinutes, List<String> blockedApps) {
        try {
            Log.d(TAG, "Starting focus session: " + durationMinutes + " minutes");
            
            sessionStartTime = System.currentTimeMillis();
            sessionDuration = durationMinutes;
            
            return startBlocking(blockedApps);
        } catch (Exception e) {
            Log.e(TAG, "Error starting focus session", e);
            return false;
        }
    }

    /**
     * Stop focus session
     */
    public boolean stopFocusSession() {
        try {
            Log.d(TAG, "Stopping focus session");
            
            sessionStartTime = 0;
            sessionDuration = 0;
            
            return stopBlocking();
        } catch (Exception e) {
            Log.e(TAG, "Error stopping focus session", e);
            return false;
        }
    }

    /**
     * Check if blocking is currently active
     */
    public boolean isBlocking() {
        return isBlockingActive && VoltAccessibilityService.isServiceRunning();
    }

    /**
     * Get currently blocked packages
     */
    public Set<String> getBlockedPackages() {
        return new HashSet<>(blockedPackages);
    }

    /**
     * Add a package to the blocked list
     */
    public boolean addBlockedApp(String packageName) {
        try {
            blockedPackages.add(packageName);
            if (isBlockingActive) {
                VoltAccessibilityService.setBlockedPackages(new ArrayList<>(blockedPackages));
            }
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error adding blocked app", e);
            return false;
        }
    }

    /**
     * Remove a package from the blocked list
     */
    public boolean removeBlockedApp(String packageName) {
        try {
            blockedPackages.remove(packageName);
            if (isBlockingActive) {
                VoltAccessibilityService.setBlockedPackages(new ArrayList<>(blockedPackages));
            }
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error removing blocked app", e);
            return false;
        }
    }

    /**
     * Show notification when an app is blocked
     */
    public void showBlockingNotification(String packageName) {
        try {
            String appName = getAppName(packageName);
            
            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent, 
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
            );

            Notification notification = new NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle("App Blocked")
                    .setContentText(appName + " is blocked during your focus session")
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(true)
                    .build();

            notificationManager.notify(BLOCKING_NOTIFICATION_ID + packageName.hashCode(), notification);
        } catch (Exception e) {
            Log.e(TAG, "Error showing blocking notification", e);
        }
    }

    /**
     * Show notification when a website is blocked
     */
    public void showWebsiteBlockingNotification(String domain, String browserPackage) {
        try {
            String browserName = getAppName(browserPackage);
            
            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent, 
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
            );

            Notification notification = new NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle("Website Blocked")
                    .setContentText(domain + " is blocked during your focus session")
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(true)
                    .build();

            notificationManager.notify(BLOCKING_NOTIFICATION_ID + domain.hashCode(), notification);
            Log.d(TAG, "Showed website blocking notification for: " + domain);
        } catch (Exception e) {
            Log.e(TAG, "Error showing website blocking notification", e);
        }
    }

    /**
     * Show persistent notification while blocking is active
     */
    private void showPersistentNotification() {
        try {
            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
            );

            String title = sessionDuration > 0 ? 
                "Focus Session Active" : "App Blocking Active";
            String text = sessionDuration > 0 ? 
                "Focus session running - " + blockedPackages.size() + " apps blocked" :
                blockedPackages.size() + " apps are currently blocked";

            Notification notification = new NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(text)
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setContentIntent(pendingIntent)
                    .setOngoing(true)
                    .build();

            notificationManager.notify(BLOCKING_NOTIFICATION_ID, notification);
        } catch (Exception e) {
            Log.e(TAG, "Error showing persistent notification", e);
        }
    }

    /**
     * Create notification channel for Android O+
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "VOLT App Blocking",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Notifications for app blocking and focus sessions");
            notificationManager.createNotificationChannel(channel);
        }
    }

    /**
     * Get app name from package name
     */
    private String getAppName(String packageName) {
        try {
            PackageManager pm = context.getPackageManager();
            ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);
            return pm.getApplicationLabel(appInfo).toString();
        } catch (Exception e) {
            return packageName;
        }
    }

    /**
     * Get session info
     */
    public long getSessionStartTime() {
        return sessionStartTime;
    }

    public int getSessionDuration() {
        return sessionDuration;
    }

    public boolean isInFocusSession() {
        return sessionStartTime > 0 && isBlockingActive;
    }

    /**
     * Show focus session notification
     */
    public void showFocusSessionNotification(int duration, int remainingTimeSeconds) {
        try {
            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
            );

            String title = "Focus Session Active";
            String remainingText = formatTime(remainingTimeSeconds);
            String text = remainingText + " remaining • " + blockedPackages.size() + " apps blocked";

            Notification notification = new NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(text)
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setContentIntent(pendingIntent)
                    .setOngoing(true) // Cannot be dismissed
                    .setAutoCancel(false)
                    .build();

            notificationManager.notify(BLOCKING_NOTIFICATION_ID + 1, notification);
            Log.d(TAG, "Focus session notification shown: " + remainingText + " remaining");
        } catch (Exception e) {
            Log.e(TAG, "Error showing focus session notification", e);
        }
    }

    /**
     * Hide focus session notification
     */
    public void hideFocusSessionNotification() {
        try {
            notificationManager.cancel(BLOCKING_NOTIFICATION_ID + 1);
            Log.d(TAG, "Focus session notification hidden");
        } catch (Exception e) {
            Log.e(TAG, "Error hiding focus session notification", e);
        }
    }

    /**
     * Format time in seconds to readable format
     */
    private String formatTime(int seconds) {
        if (seconds <= 0) return "0:00";
        
        int hours = seconds / 3600;
        int minutes = (seconds % 3600) / 60;
        int secs = seconds % 60;
        
        if (hours > 0) {
            return String.format("%d:%02d:%02d", hours, minutes, secs);
        } else {
            return String.format("%d:%02d", minutes, secs);
        }
    }
}