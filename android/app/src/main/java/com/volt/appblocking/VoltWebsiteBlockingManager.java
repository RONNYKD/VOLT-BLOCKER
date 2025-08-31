package com.volt.appblocking;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Manager class for website blocking functionality
 * Handles website blocking state, storage, and coordination with accessibility service
 */
public class VoltWebsiteBlockingManager {
    private static final String TAG = "VoltWebsiteBlockingManager";
    private static final String PREFS_NAME = "volt_website_blocking";
    private static final String KEY_BLOCKED_WEBSITES = "blocked_websites";
    private static final String KEY_WEBSITE_BLOCKING_ACTIVE = "website_blocking_active";
    
    private static VoltWebsiteBlockingManager instance;
    private Context context;
    private SharedPreferences preferences;
    private Gson gson;
    private Set<BlockedWebsite> blockedWebsites = new HashSet<>();
    private boolean isWebsiteBlockingActive = false;

    private VoltWebsiteBlockingManager(Context context) {
        this.context = context.getApplicationContext();
        this.preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        this.gson = new Gson();
        loadBlockedWebsites();
        loadWebsiteBlockingState();
    }

    public static synchronized VoltWebsiteBlockingManager getInstance(Context context) {
        if (instance == null) {
            instance = new VoltWebsiteBlockingManager(context);
        }
        return instance;
    }

    public static VoltWebsiteBlockingManager getInstance() {
        if (instance == null) {
            throw new IllegalStateException("VoltWebsiteBlockingManager not initialized. Call getInstance(Context) first.");
        }
        return instance;
    }

    /**
     * BlockedWebsite data class
     */
    public static class BlockedWebsite {
        private String domain;
        private String url;
        private String title;
        private boolean isBlocked;

        public BlockedWebsite(String domain, String url, String title, boolean isBlocked) {
            this.domain = domain;
            this.url = url;
            this.title = title;
            this.isBlocked = isBlocked;
        }

        // Getters
        public String getDomain() { return domain; }
        public String getUrl() { return url; }
        public String getTitle() { return title; }
        public boolean isBlocked() { return isBlocked; }

        // Setters
        public void setBlocked(boolean blocked) { this.isBlocked = blocked; }
        public void setTitle(String title) { this.title = title; }

        @Override
        public boolean equals(Object obj) {
            if (this == obj) return true;
            if (obj == null || getClass() != obj.getClass()) return false;
            BlockedWebsite that = (BlockedWebsite) obj;
            return domain.equals(that.domain);
        }

        @Override
        public int hashCode() {
            return domain.hashCode();
        }
    }

    // ============ WEBSITE MANAGEMENT METHODS ============

    /**
     * Add a website to the blocked list
     */
    public boolean addBlockedWebsite(String domain, String url, String title) {
        try {
            BlockedWebsite website = new BlockedWebsite(domain, url, title, true);
            blockedWebsites.add(website);
            
            saveBlockedWebsites();
            updateAccessibilityService();
            
            Log.d(TAG, "Added blocked website: " + domain);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error adding blocked website: " + domain, e);
            return false;
        }
    }

    /**
     * Remove a website from the blocked list
     */
    public boolean removeBlockedWebsite(String domain) {
        try {
            blockedWebsites.removeIf(website -> website.getDomain().equals(domain));
            
            saveBlockedWebsites();
            updateAccessibilityService();
            
            Log.d(TAG, "Removed blocked website: " + domain);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error removing blocked website: " + domain, e);
            return false;
        }
    }

    /**
     * Update the entire blocked websites list
     */
    public boolean updateBlockedWebsites(List<BlockedWebsite> websites) {
        try {
            blockedWebsites.clear();
            blockedWebsites.addAll(websites);
            
            saveBlockedWebsites();
            updateAccessibilityService();
            
            Log.d(TAG, "Updated blocked websites list: " + websites.size() + " websites");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error updating blocked websites", e);
            return false;
        }
    }

    /**
     * Get all blocked websites
     */
    public Set<BlockedWebsite> getBlockedWebsites() {
        return new HashSet<>(blockedWebsites);
    }

    /**
     * Get only active (blocked) websites
     */
    public Set<BlockedWebsite> getActiveBlockedWebsites() {
        Set<BlockedWebsite> activeWebsites = new HashSet<>();
        for (BlockedWebsite website : blockedWebsites) {
            if (website.isBlocked()) {
                activeWebsites.add(website);
            }
        }
        return activeWebsites;
    }

    /**
     * Check if a domain is blocked
     */
    public boolean isDomainBlocked(String domain) {
        if (domain == null || domain.isEmpty()) {
            return false;
        }
        
        for (BlockedWebsite website : blockedWebsites) {
            if (website.isBlocked() && VoltUrlMatcher.matchesDomain(domain, website.getDomain())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a URL is blocked
     */
    public boolean isUrlBlocked(String url) {
        return VoltUrlMatcher.isUrlBlocked(url, getBlockedDomains());
    }

    // ============ WEBSITE BLOCKING CONTROL METHODS ============

    /**
     * Start website blocking
     */
    public boolean startWebsiteBlocking() {
        try {
            isWebsiteBlockingActive = true;
            saveWebsiteBlockingState();
            updateAccessibilityService();
            
            Log.d(TAG, "Website blocking started");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error starting website blocking", e);
            return false;
        }
    }

    /**
     * Stop website blocking
     */
    public boolean stopWebsiteBlocking() {
        try {
            isWebsiteBlockingActive = false;
            saveWebsiteBlockingState();
            updateAccessibilityService();
            
            Log.d(TAG, "Website blocking stopped");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error stopping website blocking", e);
            return false;
        }
    }

    /**
     * Check if website blocking is active
     */
    public boolean isWebsiteBlockingActive() {
        return isWebsiteBlockingActive;
    }

    /**
     * Get blocked domains as a set of strings (for accessibility service)
     */
    public Set<String> getBlockedDomains() {
        Set<String> domains = new HashSet<>();
        for (BlockedWebsite website : blockedWebsites) {
            if (website.isBlocked()) {
                domains.add(website.getDomain());
            }
        }
        return domains;
    }

    // ============ PRIVATE HELPER METHODS ============

    /**
     * Load blocked websites from SharedPreferences
     */
    private void loadBlockedWebsites() {
        try {
            String json = preferences.getString(KEY_BLOCKED_WEBSITES, "[]");
            Type listType = new TypeToken<List<BlockedWebsite>>(){}.getType();
            List<BlockedWebsite> websites = gson.fromJson(json, listType);
            
            if (websites != null) {
                blockedWebsites.clear();
                blockedWebsites.addAll(websites);
                Log.d(TAG, "Loaded " + blockedWebsites.size() + " blocked websites");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error loading blocked websites", e);
            blockedWebsites.clear();
        }
    }

    /**
     * Save blocked websites to SharedPreferences
     */
    private void saveBlockedWebsites() {
        try {
            String json = gson.toJson(new ArrayList<>(blockedWebsites));
            preferences.edit().putString(KEY_BLOCKED_WEBSITES, json).apply();
            Log.d(TAG, "Saved " + blockedWebsites.size() + " blocked websites");
        } catch (Exception e) {
            Log.e(TAG, "Error saving blocked websites", e);
        }
    }

    /**
     * Load website blocking state from SharedPreferences
     */
    private void loadWebsiteBlockingState() {
        try {
            isWebsiteBlockingActive = preferences.getBoolean(KEY_WEBSITE_BLOCKING_ACTIVE, false);
            Log.d(TAG, "Loaded website blocking state: " + isWebsiteBlockingActive);
        } catch (Exception e) {
            Log.e(TAG, "Error loading website blocking state", e);
            isWebsiteBlockingActive = false;
        }
    }

    /**
     * Save website blocking state to SharedPreferences
     */
    private void saveWebsiteBlockingState() {
        try {
            preferences.edit().putBoolean(KEY_WEBSITE_BLOCKING_ACTIVE, isWebsiteBlockingActive).apply();
            Log.d(TAG, "Saved website blocking state: " + isWebsiteBlockingActive);
        } catch (Exception e) {
            Log.e(TAG, "Error saving website blocking state", e);
        }
    }

    /**
     * Update the accessibility service with current website blocking state
     */
    private void updateAccessibilityService() {
        try {
            // Update accessibility service with blocked domains and active state
            VoltAccessibilityService.setBlockedWebsites(getBlockedDomains());
            VoltAccessibilityService.setWebsiteBlockingActive(isWebsiteBlockingActive);
            
            Log.d(TAG, "Updated accessibility service with website blocking state");
        } catch (Exception e) {
            Log.e(TAG, "Error updating accessibility service", e);
        }
    }
}