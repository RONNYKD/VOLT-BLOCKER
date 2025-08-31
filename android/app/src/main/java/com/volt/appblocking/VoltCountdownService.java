package com.volt.appblocking;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/**
 * Foreground service that shows a persistent countdown notification
 * for the 2-hour permanent blocking delay
 */
public class VoltCountdownService extends Service {
    private static final String TAG = "VoltCountdownService";
    private static final String CHANNEL_ID = "volt_countdown_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final long UPDATE_INTERVAL_MS = 60000; // Update every minute

    private Handler handler;
    private Runnable updateRunnable;
    private NotificationManager notificationManager;
    private boolean isRunning = false;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Countdown service created");

        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();

        handler = new Handler(Looper.getMainLooper());
        setupUpdateRunnable();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Countdown service started");

        if (!isRunning) {
            startCountdownNotification();
            isRunning = true;
        }

        return START_STICKY; // Restart if killed
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Countdown service destroyed");

        if (handler != null && updateRunnable != null) {
            handler.removeCallbacks(updateRunnable);
        }
        isRunning = false;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "VOLT Countdown",
                    NotificationManager.IMPORTANCE_LOW // Low importance to avoid interrupting user
            );
            channel.setDescription("Shows countdown for permanent blocking disable request");
            channel.setShowBadge(false);
            channel.setSound(null, null); // No sound
            channel.enableVibration(false); // No vibration

            notificationManager.createNotificationChannel(channel);
        }
    }

    private void setupUpdateRunnable() {
        updateRunnable = new Runnable() {
            @Override
            public void run() {
                updateNotification();

                // Check if countdown is still active
                if (isCountdownActive()) {
                    handler.postDelayed(this, UPDATE_INTERVAL_MS);
                } else {
                    // Countdown finished or canceled, stop service
                    stopSelf();
                }
            }
        };
    }

    private void startCountdownNotification() {
        // Create initial notification
        Notification notification = createCountdownNotification();
        startForeground(NOTIFICATION_ID, notification);

        // Start periodic updates
        handler.post(updateRunnable);
    }

    private void updateNotification() {
        if (!isRunning)
            return;

        try {
            Notification notification = createCountdownNotification();
            notificationManager.notify(NOTIFICATION_ID, notification);
        } catch (Exception e) {
            Log.e(TAG, "Error updating notification", e);
        }
    }

    private Notification createCountdownNotification() {
        // Get countdown info from SharedPreferences
        SharedPreferences prefs = getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
        boolean isPending = prefs.getBoolean("disable_request_pending", false);
        long disableTime = prefs.getLong("disable_request_time", 0);
        long currentTime = System.currentTimeMillis();

        String title;
        String content;
        int iconResource = android.R.drawable.ic_dialog_info;

        if (!isPending || disableTime <= 0) {
            // No active countdown
            title = "🔒 VOLT - Permanent Blocking";
            content = "Permanent blocking is active";
        } else {
            long remainingMs = disableTime - currentTime;

            if (remainingMs <= 0) {
                // Countdown finished
                title = "✅ VOLT - Ready to Disable";
                content = "2-hour delay completed. You can now disable blocking.";
                iconResource = android.R.drawable.ic_dialog_alert;
            } else {
                // Active countdown
                String timeDisplay = formatRemainingTime(remainingMs);
                title = "⏰ VOLT - Countdown Active";
                content = "Blocking can be disabled in " + timeDisplay;
            }
        }

        // Create intent to open the app when notification is tapped
        Intent appIntent = new Intent(this, getMainActivityClass());
        appIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(content)
                .setSmallIcon(iconResource)
                .setContentIntent(pendingIntent)
                .setOngoing(true) // Cannot be dismissed by user
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setShowWhen(false)
                .setAutoCancel(false)
                .build();
    }

    private boolean isCountdownActive() {
        SharedPreferences prefs = getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
        boolean isPending = prefs.getBoolean("disable_request_pending", false);
        boolean isPermanentActive = prefs.getBoolean("permanent_blocking_active", false);

        // Keep service running if permanent blocking is active or countdown is pending
        return isPermanentActive && isPending;
    }

    private String formatRemainingTime(long remainingMs) {
        long hours = remainingMs / (1000 * 60 * 60);
        long minutes = (remainingMs % (1000 * 60 * 60)) / (1000 * 60);

        if (hours > 0) {
            return hours + "h " + minutes + "m";
        } else {
            return minutes + "m";
        }
    }

    private Class<?> getMainActivityClass() {
        try {
            return Class.forName(getPackageName() + ".MainActivity");
        } catch (ClassNotFoundException e) {
            Log.e(TAG, "MainActivity class not found", e);
            return null;
        }
    }

    // Static methods to control the service from other parts of the app
    public static void startCountdown(Context context, long endTimeMs) {
        Log.d(TAG, "Starting countdown service until: " + new java.util.Date(endTimeMs));
        
        // Store the end time in SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
        prefs.edit()
            .putLong("disable_request_end_time", endTimeMs)
            .putBoolean("disable_request_active", true)
            .apply();
        
        Intent intent = new Intent(context, VoltCountdownService.class);
        intent.putExtra("endTime", endTimeMs);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stopCountdown(Context context) {
        Log.d(TAG, "Stopping countdown service");
        
        // Clear the stored end time
        SharedPreferences prefs = context.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
        prefs.edit()
            .putBoolean("disable_request_active", false)
            .remove("disable_request_end_time")
            .apply();
        
        Intent intent = new Intent(context, VoltCountdownService.class);
        context.stopService(intent);
    }

    public static boolean isRunning(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("VoltBlocking", Context.MODE_PRIVATE);
        boolean isActive = prefs.getBoolean("disable_request_active", false);
        
        if (isActive) {
            long endTime = prefs.getLong("disable_request_end_time", 0);
            // Check if countdown has expired
            if (System.currentTimeMillis() >= endTime) {
                // Countdown expired, mark as inactive
                prefs.edit()
                    .putBoolean("disable_request_active", false)
                    .remove("disable_request_end_time")
                    .apply();
                return false;
            }
        }
        
        return isActive;
    }
}