package com.volt.uninstallprotection;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import android.app.AlertDialog;
import android.widget.EditText;
import android.widget.Toast;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class VoltDeviceAdminReceiver extends DeviceAdminReceiver {
    
    private static final String TAG = "VoltDeviceAdminReceiver";
    private static final String PREFS_NAME = "volt_protection_prefs";
    private static final String PREF_PASSWORD_HASH = "password_hash";
    private static final String PREF_PROTECTION_ACTIVE = "protection_active";

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.d(TAG, "Device admin enabled for VOLT uninstall protection");
        
        // Show success message
        Toast.makeText(context, "VOLT uninstall protection enabled", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Log.d(TAG, "Device admin disabled for VOLT uninstall protection");
        
        // Disable protection when device admin is disabled
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(PREF_PROTECTION_ACTIVE, false).apply();
        
        Toast.makeText(context, "VOLT uninstall protection disabled", Toast.LENGTH_SHORT).show();
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        Log.d(TAG, "Device admin disable requested");
        
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isProtectionActive = prefs.getBoolean(PREF_PROTECTION_ACTIVE, false);
        String passwordHash = prefs.getString(PREF_PASSWORD_HASH, null);
        
        // If protection is not active or no password is set, allow disable with warning
        if (!isProtectionActive || passwordHash == null) {
            return "⚠️ This will disable VOLT's uninstall protection. The app can be uninstalled after this action.";
        }
        
        // Check if override is available
        String overrideState = getOverrideState(prefs);
        if ("available".equals(overrideState)) {
            // Clear the override state after use
            prefs.edit().putString("emergency_override_state", "used").apply();
            return "✅ Emergency override is ACTIVE!\n\n" +
                   "You can now disable device admin without password.\n" +
                   "Override expires in a few minutes.";
        }
        
        // Check if password was recently verified
        long lastVerification = prefs.getLong("last_password_verification", 0);
        long currentTime = System.currentTimeMillis();
        long verificationWindow = 60 * 1000; // 60 seconds window
        
        if (currentTime - lastVerification < verificationWindow) {
            // Password was recently verified, allow disable
            prefs.edit().remove("last_password_verification").apply();
            return "✅ Password verified. Device admin will be disabled.";
        }
        
        // Instead of showing dialog, return instructions to open VOLT app
        return "🔐 VOLT Uninstall Protection is ACTIVE!\n\n" +
               "To disable protection:\n" +
               "1. Open the VOLT app\n" +
               "2. Go to Settings → Uninstall Protection\n" +
               "3. Turn off protection with your password\n" +
               "4. Then return here to disable device admin\n\n" +
               "Or request emergency override (5-hour delay) in the VOLT app.\n\n" +
               "Protection remains ACTIVE until proper authentication!";
    }
    
    // Removed problematic dialog - users must authenticate through VOLT app instead

    private void requestEmergencyOverride(Context context) {
        try {
            Log.d(TAG, "Emergency override requested from device admin");
            
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String currentState = getOverrideState(prefs);
            
            if ("pending".equals(currentState)) {
                Toast.makeText(context, "⏳ Override request is already pending", Toast.LENGTH_LONG).show();
                return;
            }
            
            if ("available".equals(currentState)) {
                Toast.makeText(context, "✅ Override is already available!", Toast.LENGTH_LONG).show();
                return;
            }
            
            // Start override request
            long currentTime = System.currentTimeMillis();
            long availableTime = currentTime + (5 * 60 * 60 * 1000); // 5 hours
            
            prefs.edit()
                .putString("emergency_override_state", "pending")
                .putLong("emergency_override_request_time", currentTime)
                .putLong("emergency_override_available_time", availableTime)
                .apply();
            
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("MMM dd, HH:mm", java.util.Locale.getDefault());
            String availableTimeStr = sdf.format(new java.util.Date(availableTime));
            
            Toast.makeText(context, 
                "🚨 Emergency override requested!\n\n" +
                "Protection remains ACTIVE for 5 hours.\n" +
                "Override available at: " + availableTimeStr + "\n" +
                "Then you'll have 15 minutes to disable.", 
                Toast.LENGTH_LONG).show();
            
            Log.d(TAG, "Emergency override request started - available at: " + availableTimeStr);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to request emergency override", e);
            Toast.makeText(context, "❌ Failed to request override", Toast.LENGTH_SHORT).show();
        }
    }
    
    private boolean verifyPassword(Context context, String password) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String storedHash = prefs.getString(PREF_PASSWORD_HASH, null);
            
            if (storedHash == null || password == null || password.isEmpty()) {
                return false;
            }
            
            String inputHash = hashString(password);
            boolean isValid = storedHash.equals(inputHash);
            
            Log.d(TAG, "Password verification: " + (isValid ? "success" : "failed"));
            return isValid;
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to verify password", e);
            return false;
        }
    }
    
    private String getOverrideState(SharedPreferences prefs) {
        try {
            String state = prefs.getString("emergency_override_state", "none");
            
            if ("none".equals(state)) {
                return "none";
            }
            
            long currentTime = System.currentTimeMillis();
            long availableTime = prefs.getLong("emergency_override_available_time", 0);
            
            if ("pending".equals(state)) {
                if (currentTime >= availableTime) {
                    // Override is now available
                    prefs.edit().putString("emergency_override_state", "available").apply();
                    return "available";
                }
                return "pending";
            }
            
            if ("available".equals(state)) {
                // Check if 15-minute window has expired
                long expirationTime = availableTime + (15 * 60 * 1000); // 15 minutes
                if (currentTime >= expirationTime) {
                    prefs.edit().putString("emergency_override_state", "expired").apply();
                    return "expired";
                }
                return "available";
            }
            
            return state;
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting override state", e);
            return "none";
        }
    }

    private void triggerDeviceAdminDisable(Context context) {
        try {
            // Open device admin settings to allow user to disable
            Intent intent = new Intent(android.provider.Settings.ACTION_SECURITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            
            Toast.makeText(context, "Go to Device Administrators and disable VOLT within 30 seconds", Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Log.e(TAG, "Failed to open device admin settings", e);
            Toast.makeText(context, "Please manually go to Settings > Security > Device Administrators and disable VOLT", Toast.LENGTH_LONG).show();
        }
    }

    private String hashString(String input) throws NoSuchAlgorithmException {
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
    }
}