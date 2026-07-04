package com.smartkrishi.service.admin;

import com.smartkrishi.dto.admin.CommissionAnalyticsDTO;
import com.smartkrishi.dto.admin.AdminDashboardStatsDTO;
import com.smartkrishi.dto.admin.FraudAlertDTO;
import com.smartkrishi.entity.Order;
import com.smartkrishi.entity.OrderItem;
import com.smartkrishi.entity.User;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.entity.Product;
import com.smartkrishi.repository.OrderRepository;
import com.smartkrishi.repository.UserRepository;
import com.smartkrishi.repository.SellerProfileRepository;
import com.smartkrishi.repository.ProductRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@AllArgsConstructor
@Slf4j
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductRepository productRepository;
    private final com.smartkrishi.repository.FeedbackRepository feedbackRepository;
    private final com.smartkrishi.repository.ReviewRepository reviewRepository;

    @Override
    @Transactional(readOnly = true)
    public CommissionAnalyticsDTO getCommissionAnalytics() {
        List<Order> paidOrders = orderRepository.findPaidOrders();
        log.info("Calculating commission analytics for {} paid orders", paidOrders.size());

        BigDecimal totalCommission = BigDecimal.ZERO;
        Map<String, BigDecimal> monthlyCommission = new LinkedHashMap<>();
        Map<String, BigDecimal> categoryCommission = new LinkedHashMap<>();

        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (Order order : paidOrders) {
            BigDecimal orderPlatformFee = order.getPlatformFee();
            if (orderPlatformFee == null || orderPlatformFee.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            totalCommission = totalCommission.add(orderPlatformFee);

            // Monthly breakdown
            String monthKey = order.getCreatedAt() != null ? order.getCreatedAt().format(monthFormatter) : "N/A";
            monthlyCommission.put(monthKey, monthlyCommission.getOrDefault(monthKey, BigDecimal.ZERO).add(orderPlatformFee));

            // Category breakdown (Proportional to line item total price relative to order subtotal)
            BigDecimal orderSubtotal = order.getSubtotalAmount();
            Set<OrderItem> items = order.getOrderItems();

            if (orderSubtotal == null || orderSubtotal.compareTo(BigDecimal.ZERO) <= 0 || items == null || items.isEmpty()) {
                continue;
            }

            for (OrderItem item : items) {
                if (item.getProduct() != null && item.getProduct().getCategory() != null) {
                    String categoryName = item.getProduct().getCategory().getCategoryName();
                    BigDecimal itemTotalPrice = item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO;

                    BigDecimal ratio = itemTotalPrice.divide(orderSubtotal, 4, RoundingMode.HALF_UP);
                    BigDecimal itemFee = orderPlatformFee.multiply(ratio).setScale(2, RoundingMode.HALF_UP);

                    categoryCommission.put(categoryName, categoryCommission.getOrDefault(categoryName, BigDecimal.ZERO).add(itemFee));
                }
            }
        }

        return CommissionAnalyticsDTO.builder()
                .totalCommission(totalCommission)
                .monthlyCommission(monthlyCommission)
                .categoryCommission(categoryCommission)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardStatsDTO getAdminDashboardStats() {
        long totalUsers = userRepository.count();
        long totalSellers = sellerProfileRepository.count();
        long pendingSellers = sellerProfileRepository.countBySellerStatus(SellerProfile.SellerStatus.PENDING);
        
        long totalProducts = productRepository.count();
        long activeProducts = productRepository.countByProductStatus(Product.ProductStatus.ACTIVE);
        
        List<Order> orders = orderRepository.findAll();
        long totalOrders = orders.size();
        
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCommission = BigDecimal.ZERO;
        
        Map<String, Long> orderStatusDistribution = new HashMap<>();
        Map<String, Long> productCategoryDistribution = new HashMap<>();
        Map<String, BigDecimal> monthlyCommissionTrend = new LinkedHashMap<>();
        Map<String, Long> monthlyUserRegistrationTrend = new LinkedHashMap<>();
        Map<String, Long> monthlyOrderVolumeTrend = new LinkedHashMap<>();
        
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        for (Order o : orders) {
            if (o.getOrderStatus() != Order.OrderStatus.CANCELLED) {
                totalRevenue = totalRevenue.add(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
                totalCommission = totalCommission.add(o.getPlatformFee() != null ? o.getPlatformFee() : BigDecimal.ZERO);
            }
            String status = o.getOrderStatus().name();
            orderStatusDistribution.put(status, orderStatusDistribution.getOrDefault(status, 0L) + 1);
            
            if (o.getCreatedAt() != null) {
                String monthStr = o.getCreatedAt().format(monthFormatter);
                monthlyOrderVolumeTrend.put(monthStr, monthlyOrderVolumeTrend.getOrDefault(monthStr, 0L) + 1);
                if (o.getOrderStatus() != Order.OrderStatus.CANCELLED && o.getPlatformFee() != null) {
                    monthlyCommissionTrend.put(monthStr, monthlyCommissionTrend.getOrDefault(monthStr, BigDecimal.ZERO).add(o.getPlatformFee()));
                }
            }
        }
        
        List<Product> products = productRepository.findAll();
        for (Product p : products) {
            if (p.getCategory() != null) {
                String catName = p.getCategory().getCategoryName();
                productCategoryDistribution.put(catName, productCategoryDistribution.getOrDefault(catName, 0L) + 1);
            }
        }
        
        List<User> users = userRepository.findAll();
        for (User u : users) {
            if (u.getCreatedAt() != null) {
                String monthStr = u.getCreatedAt().format(monthFormatter);
                monthlyUserRegistrationTrend.put(monthStr, monthlyUserRegistrationTrend.getOrDefault(monthStr, 0L) + 1);
            }
        }
        
        int activeFraudAlerts = getFraudAlerts().size();

        // --- Feedback stats ---
        long totalFeedbacks = feedbackRepository.count();
        long pendingFeedbacks = feedbackRepository.countByStatus(com.smartkrishi.entity.Feedback.FeedbackStatus.PENDING);
        
        Map<String, Long> feedbackCategoryDistribution = new HashMap<>();
        List<Map<String, Object>> catCounts = feedbackRepository.countByCategoryGrouped();
        for (Map<String, Object> item : catCounts) {
            Object key = item.get("category");
            Object val = item.get("count");
            if (key != null && val != null) {
                feedbackCategoryDistribution.put(key.toString(), ((Number) val).longValue());
            }
        }

        Map<String, Long> feedbackStatusDistribution = new HashMap<>();
        List<Map<String, Object>> statCounts = feedbackRepository.countByStatusGrouped();
        for (Map<String, Object> item : statCounts) {
            Object key = item.get("status");
            Object val = item.get("count");
            if (key != null && val != null) {
                feedbackStatusDistribution.put(key.toString(), ((Number) val).longValue());
            }
        }

        Map<String, Long> feedbackPriorityDistribution = new HashMap<>();
        List<Map<String, Object>> priCounts = feedbackRepository.countByPriorityGrouped();
        for (Map<String, Object> item : priCounts) {
            Object key = item.get("priority");
            Object val = item.get("count");
            if (key != null && val != null) {
                feedbackPriorityDistribution.put(key.toString(), ((Number) val).longValue());
            }
        }

        // --- Top rated sellers ---
        Map<String, Double> topRatedSellers = new LinkedHashMap<>();
        List<SellerProfile> sellers = sellerProfileRepository.findAll();
        List<Map.Entry<String, Double>> sellerRatings = new ArrayList<>();
        for (SellerProfile sel : sellers) {
            List<com.smartkrishi.entity.Review> sellerReviews = reviewRepository.findBySellerIdAndIsApprovedTrue(sel.getId());
            if (!sellerReviews.isEmpty()) {
                double avg = sellerReviews.stream().mapToInt(com.smartkrishi.entity.Review::getRating).average().orElse(0.0);
                sellerRatings.add(new AbstractMap.SimpleEntry<>(sel.getBusinessName() != null ? sel.getBusinessName() : "Seller #" + sel.getId(), avg));
            }
        }
        sellerRatings.sort((e1, e2) -> e2.getValue().compareTo(e1.getValue()));
        sellerRatings.stream().limit(5).forEach(e -> topRatedSellers.put(e.getKey(), e.getValue()));

        // --- Low rated products ---
        Map<String, Double> lowRatedProducts = new LinkedHashMap<>();
        List<Product> allProducts = productRepository.findAll();
        List<Map.Entry<String, Double>> productRatings = new ArrayList<>();
        for (Product prod : allProducts) {
            Double avg = reviewRepository.findAverageRatingByProductId(prod.getId());
            if (avg != null) {
                productRatings.add(new AbstractMap.SimpleEntry<>(prod.getProductName(), avg));
            }
        }
        productRatings.sort(Map.Entry.comparingByValue());
        productRatings.stream().limit(5).forEach(e -> lowRatedProducts.put(e.getKey(), e.getValue()));
        
        return AdminDashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalSellers(totalSellers)
                .pendingSellers(pendingSellers)
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .totalCommission(totalCommission)
                .activeFraudAlerts(activeFraudAlerts)
                .orderStatusDistribution(orderStatusDistribution)
                .productCategoryDistribution(productCategoryDistribution)
                .monthlyCommissionTrend(monthlyCommissionTrend)
                .monthlyUserRegistrationTrend(monthlyUserRegistrationTrend)
                .monthlyOrderVolumeTrend(monthlyOrderVolumeTrend)
                .totalFeedbacks(totalFeedbacks)
                .pendingFeedbacks(pendingFeedbacks)
                .feedbackCategoryDistribution(feedbackCategoryDistribution)
                .feedbackStatusDistribution(feedbackStatusDistribution)
                .feedbackPriorityDistribution(feedbackPriorityDistribution)
                .topRatedSellers(topRatedSellers)
                .lowRatedProducts(lowRatedProducts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FraudAlertDTO> getFraudAlerts() {
        List<FraudAlertDTO> alerts = new ArrayList<>();
        long idCounter = 1;

        // 1. High value order alerts
        List<Order> orders = orderRepository.findAll();
        for (Order o : orders) {
            BigDecimal amount = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
            if (amount.compareTo(BigDecimal.valueOf(50000)) > 0) {
                alerts.add(FraudAlertDTO.builder()
                        .id(idCounter++)
                        .type("High Value Order")
                        .detail("Order " + o.getOrderNumber() + " total value is ₹" + amount.setScale(2, RoundingMode.HALF_UP) + " (Limit: ₹50,000)")
                        .severity("HIGH")
                        .affectedUserEmail(o.getBuyer() != null ? o.getBuyer().getEmail() : "N/A")
                        .affectedUserId(o.getBuyer() != null ? o.getBuyer().getId() : null)
                        .createdAt(o.getCreatedAt())
                        .build());
            }
        }

        // 2. Pricing Anomaly alerts
        List<Product> products = productRepository.findAll();
        for (Product p : products) {
            BigDecimal price = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
            if (price.compareTo(BigDecimal.ZERO) <= 0) {
                alerts.add(FraudAlertDTO.builder()
                        .id(idCounter++)
                        .type("Price Anomaly")
                        .detail("Product '" + p.getProductName() + "' is listed with an invalid price: ₹" + price)
                        .severity("CRITICAL")
                        .affectedUserEmail(p.getSeller() != null && p.getSeller().getUser() != null ? p.getSeller().getUser().getEmail() : "System")
                        .affectedUserId(p.getSeller() != null && p.getSeller().getUser() != null ? p.getSeller().getUser().getId() : null)
                        .createdAt(p.getCreatedAt())
                        .build());
            } else if (p.getDiscountPercentage() != null && p.getDiscountPercentage().compareTo(BigDecimal.valueOf(90)) > 0) {
                alerts.add(FraudAlertDTO.builder()
                        .id(idCounter++)
                        .type("Price Anomaly")
                        .detail("Product '" + p.getProductName() + "' has an extreme discount of " + p.getDiscountPercentage() + "%")
                        .severity("HIGH")
                        .affectedUserEmail(p.getSeller() != null && p.getSeller().getUser() != null ? p.getSeller().getUser().getEmail() : "System")
                        .affectedUserId(p.getSeller() != null && p.getSeller().getUser() != null ? p.getSeller().getUser().getId() : null)
                        .createdAt(p.getCreatedAt())
                        .build());
            }
        }

        // 3. User account checks (Suspended sellers posting active products)
        for (Product p : products) {
            if (p.getSeller() != null && p.getSeller().getSellerStatus() == SellerProfile.SellerStatus.SUSPENDED && p.getProductStatus() == Product.ProductStatus.ACTIVE) {
                alerts.add(FraudAlertDTO.builder()
                        .id(idCounter++)
                        .type("Governance Conflict")
                        .detail("Product '" + p.getProductName() + "' is active but its seller '" + p.getSeller().getBusinessName() + "' is currently suspended.")
                        .severity("MEDIUM")
                        .affectedUserEmail(p.getSeller().getUser() != null ? p.getSeller().getUser().getEmail() : "N/A")
                        .affectedUserId(p.getSeller().getUser() != null ? p.getSeller().getUser().getId() : null)
                        .createdAt(p.getUpdatedAt())
                        .build());
            }
        }

        alerts.sort((a, b) -> b.getId().compareTo(a.getId()));
        return alerts;
    }
}
