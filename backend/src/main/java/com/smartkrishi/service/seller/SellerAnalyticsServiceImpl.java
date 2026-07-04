package com.smartkrishi.service.seller;

import com.smartkrishi.dto.seller.SellerAnalyticsDTO;
import com.smartkrishi.dto.seller.SellerAnalyticsDTO.TopProductDTO;
import com.smartkrishi.dto.seller.SellerAnalyticsDTO.ChartDataPointDTO;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.entity.Order;
import com.smartkrishi.entity.Product;
import com.smartkrishi.exception.ResourceNotFoundException;
import com.smartkrishi.repository.SellerProfileRepository;
import com.smartkrishi.repository.OrderRepository;
import com.smartkrishi.repository.ProductRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class SellerAnalyticsServiceImpl implements SellerAnalyticsService {

    private final SellerProfileRepository sellerProfileRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final com.smartkrishi.repository.ReviewRepository reviewRepository;

    @Override
    public SellerAnalyticsDTO getSellerAnalytics(Long userId) {
        SellerProfile seller = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found for user: " + userId));
        
        Long sellerId = seller.getId();
        
        // Fetch all non-deleted products
        List<Product> products = productRepository.findBySellerIdAndDeletedAtIsNull(sellerId);
        
        // Fetch all orders
        List<Order> orders = orderRepository.findBySellerId(sellerId);
        
        // --- 1. Overview Metrics ---
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal netRevenue = BigDecimal.ZERO;
        long totalOrdersCount = orders.size();
        long pendingOrders = 0;
        long deliveredOrders = 0;
        long cancelledOrders = 0;
        
        for (Order o : orders) {
            if (o.getOrderStatus() != Order.OrderStatus.CANCELLED) {
                totalRevenue = totalRevenue.add(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
                netRevenue = netRevenue.add(o.getSellerAmount() != null ? o.getSellerAmount() : BigDecimal.ZERO);
            }
            
            if (o.getOrderStatus() == Order.OrderStatus.PENDING || o.getOrderStatus() == Order.OrderStatus.ACCEPTED) {
                pendingOrders++;
            } else if (o.getOrderStatus() == Order.OrderStatus.DELIVERED) {
                deliveredOrders++;
            } else if (o.getOrderStatus() == Order.OrderStatus.CANCELLED) {
                cancelledOrders++;
            }
        }
        
        // --- 2. Repeat Customers ---
        Map<Long, Integer> buyerOrderCounts = new HashMap<>();
        for (Order o : orders) {
            if (o.getBuyer() != null) {
                Long buyerId = o.getBuyer().getId();
                buyerOrderCounts.put(buyerId, buyerOrderCounts.getOrDefault(buyerId, 0) + 1);
            }
        }
        long totalCustomers = buyerOrderCounts.size();
        long repeatCustomers = buyerOrderCounts.values().stream().filter(c -> c > 1).count();
        double repeatCustomerRate = totalCustomers > 0 ? ((double) repeatCustomers / totalCustomers) * 100.0 : 0.0;
        
        // --- 3. Conversion Rates ---
        long totalViews = 0;
        long totalPurchases = 0;
        for (Product p : products) {
            totalViews += p.getViewCount() != null ? p.getViewCount() : 0;
            totalPurchases += p.getPurchaseCount() != null ? p.getPurchaseCount() : 0;
        }
        double conversionRate = totalViews > 0 ? ((double) totalPurchases / totalViews) * 100.0 : 0.0;
        
        // --- 4. Inventory Health ---
        long totalProducts = products.size();
        long activeProducts = 0;
        long outOfStockProducts = 0;
        long lowStockProducts = 0;
        
        for (Product p : products) {
            if (p.getProductStatus() == Product.ProductStatus.ACTIVE) {
                activeProducts++;
            }
            if (p.getInventory() != null) {
                int quantity = p.getInventory().getQuantityAvailable() != null ? p.getInventory().getQuantityAvailable() : 0;
                int reorderLvl = p.getInventory().getReorderLevel() != null ? p.getInventory().getReorderLevel() : 10;
                if (quantity <= 0) {
                    outOfStockProducts++;
                } else if (quantity <= reorderLvl) {
                    lowStockProducts++;
                }
            }
        }
        
        // --- 5. Top Products ---
        List<TopProductDTO> topProducts = products.stream()
                .filter(p -> p.getPurchaseCount() != null && p.getPurchaseCount() > 0)
                .sorted((p1, p2) -> p2.getPurchaseCount().compareTo(p1.getPurchaseCount()))
                .limit(5)
                .map(p -> TopProductDTO.builder()
                        .id(p.getId())
                        .productName(p.getProductName())
                        .sku(p.getSku())
                        .price(p.getPrice())
                        .quantitySold(p.getPurchaseCount())
                        .totalRevenue(p.getPrice().multiply(BigDecimal.valueOf(p.getPurchaseCount())))
                        .build())
                .collect(Collectors.toList());
        
        // --- 6. Chart Data ---
        LocalDateTime now = LocalDateTime.now();
        
        // Daily Chart (last 30 days)
        List<ChartDataPointDTO> dailyChart = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate date = now.minusDays(i).toLocalDate();
            BigDecimal dayRevenue = BigDecimal.ZERO;
            long dayOrders = 0;
            for (Order o : orders) {
                if (o.getCreatedAt().toLocalDate().equals(date) && o.getOrderStatus() != Order.OrderStatus.CANCELLED) {
                    dayRevenue = dayRevenue.add(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
                    dayOrders++;
                }
            }
            dailyChart.add(new ChartDataPointDTO(date.toString(), dayRevenue, dayOrders));
        }
        
        // Weekly Chart (last 12 weeks)
        List<ChartDataPointDTO> weeklyChart = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate weekStart = now.minusWeeks(i).toLocalDate().with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
            LocalDate weekEnd = weekStart.plusDays(6);
            BigDecimal weekRevenue = BigDecimal.ZERO;
            long weekOrders = 0;
            for (Order o : orders) {
                LocalDate orderDate = o.getCreatedAt().toLocalDate();
                if (!orderDate.isBefore(weekStart) && !orderDate.isAfter(weekEnd) && o.getOrderStatus() != Order.OrderStatus.CANCELLED) {
                    weekRevenue = weekRevenue.add(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
                    weekOrders++;
                }
            }
            weeklyChart.add(new ChartDataPointDTO(weekStart.toString(), weekRevenue, weekOrders));
        }
        
        // Monthly Chart (last 12 months)
        List<ChartDataPointDTO> monthlyChart = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth yearMonth = YearMonth.from(now.minusMonths(i));
            BigDecimal monthRevenue = BigDecimal.ZERO;
            long monthOrders = 0;
            for (Order o : orders) {
                YearMonth orderYearMonth = YearMonth.from(o.getCreatedAt());
                if (orderYearMonth.equals(yearMonth) && o.getOrderStatus() != Order.OrderStatus.CANCELLED) {
                    monthRevenue = monthRevenue.add(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
                    monthOrders++;
                }
            }
            monthlyChart.add(new ChartDataPointDTO(yearMonth.getMonth().name().substring(0, 3) + " " + yearMonth.getYear(), monthRevenue, monthOrders));
        }
        
        // Yearly Chart (last 5 years)
        List<ChartDataPointDTO> yearlyChart = new ArrayList<>();
        int currentYear = now.getYear();
        for (int i = 4; i >= 0; i--) {
            int year = currentYear - i;
            BigDecimal yearRevenue = BigDecimal.ZERO;
            long yearOrders = 0;
            for (Order o : orders) {
                if (o.getCreatedAt().getYear() == year && o.getOrderStatus() != Order.OrderStatus.CANCELLED) {
                    yearRevenue = yearRevenue.add(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
                    yearOrders++;
                }
            }
            yearlyChart.add(new ChartDataPointDTO(String.valueOf(year), yearRevenue, yearOrders));
        }
        
        // --- 7. Reviews and Ratings Analytics ---
        List<com.smartkrishi.entity.Review> reviewsList = reviewRepository.findBySellerIdAndIsApprovedTrue(sellerId);
        
        long totalReviews = reviewsList.size();
        BigDecimal avgRating = BigDecimal.ZERO;
        double csatScore = 0.0;
        double deliveryAvg = 0.0;
        double productQualityAvg = 0.0;
        double communicationAvg = 0.0;
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0L);
        }

        if (totalReviews > 0) {
            double sumRating = 0;
            long positiveReviews = 0;
            double sumDelivery = 0;
            int countDelivery = 0;
            double sumProductQuality = 0;
            int countProductQuality = 0;
            double sumCommunication = 0;
            int countCommunication = 0;

            for (com.smartkrishi.entity.Review r : reviewsList) {
                sumRating += r.getRating();
                ratingDistribution.put(r.getRating(), ratingDistribution.getOrDefault(r.getRating(), 0L) + 1);
                
                if (r.getRating() >= 4) {
                    positiveReviews++;
                }

                if (r.getDeliveryExperience() != null) {
                    sumDelivery += r.getDeliveryExperience();
                    countDelivery++;
                }
                if (r.getProductQualityRating() != null) {
                    sumProductQuality += r.getProductQualityRating();
                    countProductQuality++;
                }
                if (r.getCommunicationRating() != null) {
                    sumCommunication += r.getCommunicationRating();
                    countCommunication++;
                }
            }

            avgRating = BigDecimal.valueOf(sumRating / totalReviews).setScale(2, java.math.RoundingMode.HALF_UP);
            csatScore = ((double) positiveReviews / totalReviews) * 100.0;
            
            if (countDelivery > 0) {
                deliveryAvg = sumDelivery / countDelivery;
            }
            if (countProductQuality > 0) {
                productQualityAvg = sumProductQuality / countProductQuality;
            }
            if (countCommunication > 0) {
                communicationAvg = sumCommunication / countCommunication;
            }
        }
        
        return SellerAnalyticsDTO.builder()
                .totalRevenue(totalRevenue)
                .netRevenue(netRevenue)
                .totalOrders(totalOrdersCount)
                .pendingOrders(pendingOrders)
                .deliveredOrders(deliveredOrders)
                .cancelledOrders(cancelledOrders)
                .totalCustomers(totalCustomers)
                .repeatCustomers(repeatCustomers)
                .repeatCustomerRate(repeatCustomerRate)
                .conversionRate(conversionRate)
                .totalViews(totalViews)
                .totalPurchases(totalPurchases)
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .outOfStockProducts(outOfStockProducts)
                .lowStockProducts(lowStockProducts)
                .topProducts(topProducts)
                .dailyChart(dailyChart)
                .weeklyChart(weeklyChart)
                .monthlyChart(monthlyChart)
                .yearlyChart(yearlyChart)
                .averageRating(avgRating)
                .totalReviews(totalReviews)
                .customerSatisfactionScore(csatScore)
                .ratingDistribution(ratingDistribution)
                .deliveryExperienceAvg(deliveryAvg)
                .productQualityAvg(productQualityAvg)
                .communicationAvg(communicationAvg)
                .build();
    }
}
