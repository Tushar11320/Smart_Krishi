package com.smartkrishi.common.constants;

public final class AppConstants {

    private AppConstants() {
        throw new IllegalStateException("Constants class");
    }

    // Pagination
    public static final String DEFAULT_PAGE_NUMBER = "0";
    public static final String DEFAULT_PAGE_SIZE = "20";
    public static final String DEFAULT_SORT_BY = "createdAt";
    public static final String DEFAULT_SORT_DIRECTION = "desc";

    // Security
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
    public static final long ACCESS_TOKEN_VALIDITY = 24 * 60 * 60 * 1000; // 24 hours
    public static final long REFRESH_TOKEN_VALIDITY = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Roles
    public static final String ROLE_BUYER = "BUYER";
    public static final String ROLE_SELLER = "SELLER";
    public static final String ROLE_ADMIN = "ADMIN";

    // Order Status
    public static final String ORDER_PENDING = "PENDING";
    public static final String ORDER_ACCEPTED = "ACCEPTED";
    public static final String ORDER_PROCESSING = "PROCESSING";
    public static final String ORDER_SHIPPED = "SHIPPED";
    public static final String ORDER_DELIVERED = "DELIVERED";
    public static final String ORDER_CANCELLED = "CANCELLED";

    // Payment Status
    public static final String PAYMENT_PENDING = "PENDING";
    public static final String PAYMENT_COMPLETED = "COMPLETED";
    public static final String PAYMENT_FAILED = "FAILED";
    public static final String PAYMENT_REFUNDED = "REFUNDED";

    // Product Status
    public static final String PRODUCT_ACTIVE = "ACTIVE";
    public static final String PRODUCT_INACTIVE = "INACTIVE";
    public static final String PRODUCT_OUT_OF_STOCK = "OUT_OF_STOCK";
    public static final String PRODUCT_DISCONTINUED = "DISCONTINUED";

    // Seller Status
    public static final String SELLER_PENDING = "PENDING";
    public static final String SELLER_VERIFIED = "VERIFIED";
    public static final String SELLER_SUSPENDED = "SUSPENDED";
    public static final String SELLER_REJECTED = "REJECTED";

    // Land Status
    public static final String LAND_AVAILABLE = "AVAILABLE";
    public static final String LAND_SOLD = "SOLD";
    public static final String LAND_UNDER_NEGOTIATION = "UNDER_NEGOTIATION";
    public static final String LAND_DELISTED = "DELISTED";

    // Notification Types
    public static final String NOTIFICATION_ORDER_CONFIRMATION = "ORDER_CONFIRMATION";
    public static final String NOTIFICATION_ORDER_SHIPPED = "ORDER_SHIPPED";
    public static final String NOTIFICATION_ORDER_DELIVERED = "ORDER_DELIVERED";
    public static final String NOTIFICATION_PAYMENT_RECEIVED = "PAYMENT_RECEIVED";
    public static final String NOTIFICATION_PAYMENT_FAILED = "PAYMENT_FAILED";
    public static final String NOTIFICATION_REVIEW_RECEIVED = "REVIEW_RECEIVED";
    public static final String NOTIFICATION_SELLER_VERIFICATION = "SELLER_VERIFICATION";
    public static final String NOTIFICATION_PRODUCT_OUT_OF_STOCK = "PRODUCT_OUT_OF_STOCK";
    public static final String NOTIFICATION_PRICE_DROP = "PRICE_DROP";

    // File Upload
    public static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    public static final String[] ALLOWED_IMAGE_TYPES = { "image/jpeg", "image/jpg", "image/png", "image/gif" };
    public static final String[] ALLOWED_DOCUMENT_TYPES = { "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };

    // Categories
    public static final String CATEGORY_MACHINERY = "Machinery";
    public static final String CATEGORY_FARMING_EQUIPMENT = "Farming Equipment";
    public static final String CATEGORY_FERTILIZERS = "Fertilizers";
    public static final String CATEGORY_CROPS = "Crops";
    public static final String CATEGORY_SEEDS = "Seeds";
    public static final String CATEGORY_PESTICIDES = "Pesticides";
    public static final String CATEGORY_MILK = "Milk";
    public static final String CATEGORY_DAIRY = "Dairy Products";
    public static final String CATEGORY_ANIMAL_FEED = "Animal Feed";
    public static final String CATEGORY_BUILDING_MATERIALS = "Building Materials";

    // Cache Names
    public static final String CACHE_PRODUCTS = "products";
    public static final String CACHE_CATEGORIES = "categories";
    public static final String CACHE_SELLERS = "sellers";
    public static final String CACHE_WEATHER = "weather";

    // API Endpoints
    public static final String API_BASE_PATH = "/api";
    public static final String API_VERSION = "/v1";

    // Email Templates
    public static final String EMAIL_TEMPLATE_REGISTRATION = "registration";
    public static final String EMAIL_TEMPLATE_PASSWORD_RESET = "password-reset";
    public static final String EMAIL_TEMPLATE_ORDER_CONFIRMATION = "order-confirmation";
    public static final String EMAIL_TEMPLATE_ORDER_SHIPPED = "order-shipped";
    public static final String EMAIL_TEMPLATE_SELLER_VERIFICATION = "seller-verification";

    // Date Formats
    public static final String DATE_FORMAT = "yyyy-MM-dd";
    public static final String DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    public static final String TIME_FORMAT = "HH:mm:ss";

    // Currency
    public static final String DEFAULT_CURRENCY = "INR";
    public static final String CURRENCY_SYMBOL = "₹";

    // Response Messages
    public static final String SUCCESS = "Success";
    public static final String FAILURE = "Failure";
    public static final String NOT_FOUND = "Resource not found";
    public static final String UNAUTHORIZED = "Unauthorized access";
    public static final String FORBIDDEN = "Access forbidden";
    public static final String BAD_REQUEST = "Bad request";
    public static final String INTERNAL_SERVER_ERROR = "Internal server error";
}
