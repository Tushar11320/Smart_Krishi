package com.smartkrishi.common.utils;

import java.util.regex.Pattern;

public final class ValidationUtils {
    
    private ValidationUtils() {
        throw new IllegalStateException("Utility class");
    }
    
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern GST_PATTERN = Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");
    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]{1}$");
    private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");
    private static final Pattern IFSC_PATTERN = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");
    
    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }
    
    public static boolean isValidPhone(String phone) {
        return phone != null && PHONE_PATTERN.matcher(phone).matches();
    }
    
    public static boolean isValidGST(String gst) {
        return gst != null && GST_PATTERN.matcher(gst).matches();
    }
    
    public static boolean isValidPAN(String pan) {
        return pan != null && PAN_PATTERN.matcher(pan).matches();
    }
    
    public static boolean isValidPincode(String pincode) {
        return pincode != null && PINCODE_PATTERN.matcher(pincode).matches();
    }
    
    public static boolean isValidIFSC(String ifsc) {
        return ifsc != null && IFSC_PATTERN.matcher(ifsc).matches();
    }
    
    public static boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
    
    public static boolean isNotBlank(String str) {
        return !isBlank(str);
    }
    
    public static boolean isValidPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;
        
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
            else hasSpecial = true;
        }
        
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}
