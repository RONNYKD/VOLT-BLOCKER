package com.volt.appblocking;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.Log;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Browser monitoring utility for website blocking
 * Detects browsers and extracts URLs from their UI elements
 */
public class VoltBrowserMonitor {
    private static final String TAG = "VoltBrowserMonitor";
    
    // Known browser package names and their metadata
    private static final Map<String, BrowserInfo> SUPPORTED_BROWSERS = new HashMap<>();
    
    static {
        // Chrome browsers
        SUPPORTED_BROWSERS.put("com.android.chrome", new BrowserInfo(
            "com.android.chrome", "Chrome", "address_bar_node", true
        ));
        SUPPORTED_BROWSERS.put("com.chrome.beta", new BrowserInfo(
            "com.chrome.beta", "Chrome Beta", "address_bar_node", true
        ));
        SUPPORTED_BROWSERS.put("com.chrome.dev", new BrowserInfo(
            "com.chrome.dev", "Chrome Dev", "address_bar_node", true
        ));
        
        // Firefox browsers
        SUPPORTED_BROWSERS.put("org.mozilla.firefox", new BrowserInfo(
            "org.mozilla.firefox", "Firefox", "url_bar_node", true
        ));
        SUPPORTED_BROWSERS.put("org.mozilla.firefox_beta", new BrowserInfo(
            "org.mozilla.firefox_beta", "Firefox Beta", "url_bar_node", true
        ));
        
        // Samsung Internet
        SUPPORTED_BROWSERS.put("com.sec.android.app.sbrowser", new BrowserInfo(
            "com.sec.android.app.sbrowser", "Samsung Internet", "address_bar_node", true
        ));
        
        // Microsoft Edge
        SUPPORTED_BROWSERS.put("com.microsoft.emmx", new BrowserInfo(
            "com.microsoft.emmx", "Microsoft Edge", "address_bar_node", true
        ));
        
        // Opera browsers
        SUPPORTED_BROWSERS.put("com.opera.browser", new BrowserInfo(
            "com.opera.browser", "Opera", "address_bar_node", true
        ));
        SUPPORTED_BROWSERS.put("com.opera.mini.native", new BrowserInfo(
            "com.opera.mini.native", "Opera Mini", "address_bar_node", true
        ));
        
        // Brave Browser
        SUPPORTED_BROWSERS.put("com.brave.browser", new BrowserInfo(
            "com.brave.browser", "Brave Browser", "address_bar_node", true
        ));
        
        // DuckDuckGo Browser
        SUPPORTED_BROWSERS.put("com.duckduckgo.mobile.android", new BrowserInfo(
            "com.duckduckgo.mobile.android", "DuckDuckGo Browser", "address_bar_node", true
        ));
        
        // Vivaldi Browser
        SUPPORTED_BROWSERS.put("com.vivaldi.browser", new BrowserInfo(
            "com.vivaldi.browser", "Vivaldi", "address_bar_node", true
        ));
    }

    /**
     * Browser information data class
     */
    public static class BrowserInfo {
        private String packageName;
        private String appName;
        private String urlExtractionMethod;
        private boolean isSupported;

        public BrowserInfo(String packageName, String appName, String urlExtractionMethod, boolean isSupported) {
            this.packageName = packageName;
            this.appName = appName;
            this.urlExtractionMethod = urlExtractionMethod;
            this.isSupported = isSupported;
        }

        // Getters
        public String getPackageName() { return packageName; }
        public String getAppName() { return appName; }
        public String getUrlExtractionMethod() { return urlExtractionMethod; }
        public boolean isSupported() { return isSupported; }
    }

    /**
     * Get list of supported browsers installed on the device
     */
    public static List<BrowserInfo> getSupportedBrowsers(Context context) {
        List<BrowserInfo> installedBrowsers = new ArrayList<>();
        PackageManager packageManager = context.getPackageManager();

        for (BrowserInfo browserInfo : SUPPORTED_BROWSERS.values()) {
            try {
                // Check if the browser is installed
                ApplicationInfo appInfo = packageManager.getApplicationInfo(browserInfo.getPackageName(), 0);
                if (appInfo != null) {
                    installedBrowsers.add(browserInfo);
                    Log.d(TAG, "Found supported browser: " + browserInfo.getAppName());
                }
            } catch (PackageManager.NameNotFoundException e) {
                // Browser not installed, skip
                Log.d(TAG, "Browser not installed: " + browserInfo.getAppName());
            }
        }

        Log.d(TAG, "Found " + installedBrowsers.size() + " supported browsers");
        return installedBrowsers;
    }

    /**
     * Check if a package name belongs to a browser app
     */
    public static boolean isBrowserApp(String packageName) {
        if (packageName == null || packageName.isEmpty()) {
            return false;
        }

        boolean isBrowser = SUPPORTED_BROWSERS.containsKey(packageName);
        if (isBrowser) {
            Log.d(TAG, "Detected browser app: " + packageName);
        }
        
        return isBrowser;
    }

    /**
     * Get browser information for a specific package
     */
    public static BrowserInfo getBrowserInfo(String packageName) {
        return SUPPORTED_BROWSERS.get(packageName);
    }

    /**
     * Extract URL from browser using accessibility node traversal
     */
    public static String extractUrlFromBrowser(AccessibilityNodeInfo rootNode, String browserPackage) {
        if (rootNode == null || browserPackage == null) {
            return null;
        }

        try {
            Log.d(TAG, "Attempting to extract URL from browser: " + browserPackage);
            
            String url = null;
            
            // Try browser-specific extraction methods
            switch (browserPackage) {
                case "com.android.chrome":
                case "com.chrome.beta":
                case "com.chrome.dev":
                    url = extractChromeUrl(rootNode);
                    break;
                    
                case "org.mozilla.firefox":
                case "org.mozilla.firefox_beta":
                    url = extractFirefoxUrl(rootNode);
                    break;
                    
                case "com.sec.android.app.sbrowser":
                    url = extractSamsungInternetUrl(rootNode);
                    break;
                    
                default:
                    // Try generic extraction for other browsers
                    url = extractGenericUrl(rootNode);
                    break;
            }
            
            if (url != null && !url.isEmpty()) {
                Log.d(TAG, "Successfully extracted URL: " + url);
                return url;
            } else {
                Log.w(TAG, "Failed to extract URL from browser: " + browserPackage);
                return null;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error extracting URL from browser: " + browserPackage, e);
            return null;
        }
    }

    /**
     * Extract URL from Chrome browser
     */
    private static String extractChromeUrl(AccessibilityNodeInfo rootNode) {
        try {
            // Chrome typically has the URL in an EditText with resource ID containing "url_bar" or "omnibox"
            String url = findUrlByResourceId(rootNode, "url_bar");
            if (url != null) return url;
            
            url = findUrlByResourceId(rootNode, "omnibox");
            if (url != null) return url;
            
            // Try finding by content description
            url = findUrlByContentDescription(rootNode, "Address and search bar");
            if (url != null) return url;
            
            // Try finding by class name (EditText that might contain URL)
            url = findUrlByClassName(rootNode, "android.widget.EditText");
            if (url != null) return url;
            
            Log.d(TAG, "Chrome URL extraction: No URL found using standard methods");
            return null;
            
        } catch (Exception e) {
            Log.e(TAG, "Error extracting Chrome URL", e);
            return null;
        }
    }

    /**
     * Extract URL from Firefox browser
     */
    private static String extractFirefoxUrl(AccessibilityNodeInfo rootNode) {
        try {
            // Firefox typically has the URL in an EditText with specific resource IDs
            String url = findUrlByResourceId(rootNode, "url_bar_title");
            if (url != null) return url;
            
            url = findUrlByResourceId(rootNode, "mozac_browser_toolbar_url_view");
            if (url != null) return url;
            
            // Try finding by content description
            url = findUrlByContentDescription(rootNode, "Search or enter address");
            if (url != null) return url;
            
            // Try generic EditText search
            url = findUrlByClassName(rootNode, "android.widget.EditText");
            if (url != null) return url;
            
            Log.d(TAG, "Firefox URL extraction: No URL found using standard methods");
            return null;
            
        } catch (Exception e) {
            Log.e(TAG, "Error extracting Firefox URL", e);
            return null;
        }
    }

    /**
     * Extract URL from Samsung Internet browser
     */
    private static String extractSamsungInternetUrl(AccessibilityNodeInfo rootNode) {
        try {
            // Samsung Internet has its own URL bar structure
            String url = findUrlByResourceId(rootNode, "location_bar_edit_text");
            if (url != null) return url;
            
            url = findUrlByResourceId(rootNode, "url_bar");
            if (url != null) return url;
            
            // Try finding by content description
            url = findUrlByContentDescription(rootNode, "Address bar");
            if (url != null) return url;
            
            // Try generic EditText search
            url = findUrlByClassName(rootNode, "android.widget.EditText");
            if (url != null) return url;
            
            Log.d(TAG, "Samsung Internet URL extraction: No URL found using standard methods");
            return null;
            
        } catch (Exception e) {
            Log.e(TAG, "Error extracting Samsung Internet URL", e);
            return null;
        }
    }

    /**
     * Generic URL extraction for unknown browsers
     */
    private static String extractGenericUrl(AccessibilityNodeInfo rootNode) {
        try {
            Log.d(TAG, "Attempting generic URL extraction");
            
            // Try common resource ID patterns
            String[] commonUrlResourceIds = {
                "url_bar", "address_bar", "omnibox", "location_bar", 
                "url_field", "address_field", "search_bar"
            };
            
            for (String resourceId : commonUrlResourceIds) {
                String url = findUrlByResourceId(rootNode, resourceId);
                if (url != null) {
                    Log.d(TAG, "Generic extraction found URL using resource ID: " + resourceId);
                    return url;
                }
            }
            
            // Try common content descriptions
            String[] commonDescriptions = {
                "Address and search bar", "Search or enter address", "Address bar",
                "URL bar", "Location bar", "Search bar"
            };
            
            for (String description : commonDescriptions) {
                String url = findUrlByContentDescription(rootNode, description);
                if (url != null) {
                    Log.d(TAG, "Generic extraction found URL using content description: " + description);
                    return url;
                }
            }
            
            // Last resort: try any EditText that might contain a URL
            String url = findUrlByClassName(rootNode, "android.widget.EditText");
            if (url != null) {
                Log.d(TAG, "Generic extraction found URL using EditText search");
                return url;
            }
            
            Log.d(TAG, "Generic URL extraction: No URL found");
            return null;
            
        } catch (Exception e) {
            Log.e(TAG, "Error in generic URL extraction", e);
            return null;
        }
    }

    // ============ HELPER METHODS FOR URL EXTRACTION ============

    /**
     * Find URL by resource ID
     */
    private static String findUrlByResourceId(AccessibilityNodeInfo node, String resourceIdSuffix) {
        if (node == null) return null;
        
        try {
            // Check current node
            String resourceId = node.getViewIdResourceName();
            if (resourceId != null && resourceId.contains(resourceIdSuffix)) {
                CharSequence text = node.getText();
                if (text != null && isValidUrl(text.toString())) {
                    return text.toString();
                }
            }
            
            // Check child nodes recursively
            for (int i = 0; i < node.getChildCount(); i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    String url = findUrlByResourceId(child, resourceIdSuffix);
                    if (url != null) {
                        return url;
                    }
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error finding URL by resource ID: " + resourceIdSuffix, e);
        }
        
        return null;
    }

    /**
     * Find URL by content description
     */
    private static String findUrlByContentDescription(AccessibilityNodeInfo node, String description) {
        if (node == null) return null;
        
        try {
            // Check current node
            CharSequence contentDesc = node.getContentDescription();
            if (contentDesc != null && contentDesc.toString().contains(description)) {
                CharSequence text = node.getText();
                if (text != null && isValidUrl(text.toString())) {
                    return text.toString();
                }
            }
            
            // Check child nodes recursively
            for (int i = 0; i < node.getChildCount(); i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    String url = findUrlByContentDescription(child, description);
                    if (url != null) {
                        return url;
                    }
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error finding URL by content description: " + description, e);
        }
        
        return null;
    }

    /**
     * Find URL by class name (e.g., EditText)
     */
    private static String findUrlByClassName(AccessibilityNodeInfo node, String className) {
        if (node == null) return null;
        
        try {
            // Check current node
            CharSequence nodeClassName = node.getClassName();
            if (nodeClassName != null && nodeClassName.toString().equals(className)) {
                CharSequence text = node.getText();
                if (text != null && isValidUrl(text.toString())) {
                    return text.toString();
                }
            }
            
            // Check child nodes recursively
            for (int i = 0; i < node.getChildCount(); i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) {
                    String url = findUrlByClassName(child, className);
                    if (url != null) {
                        return url;
                    }
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error finding URL by class name: " + className, e);
        }
        
        return null;
    }

    /**
     * Basic URL validation
     */
    private static boolean isValidUrl(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }
        
        String trimmed = text.trim();
        
        // Check if it looks like a URL
        return trimmed.contains(".") && 
               (trimmed.startsWith("http://") || 
                trimmed.startsWith("https://") || 
                trimmed.matches("^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}.*"));
    }
}