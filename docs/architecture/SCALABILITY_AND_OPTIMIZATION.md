# Smart Krishi - Database Scalability & Optimization Guide

## Introduction

This document provides comprehensive strategies for scaling the Smart Krishi database to support 1M+ users, 100K+ sellers, and millions of products with consistent sub-second query performance.

---

## 1. Horizontal Scalability (Sharding)

### 1.1 Sharding Strategy

**Goal**: Distribute data across multiple database nodes to achieve linear scalability.

#### Sharding Key Selection

```
Primary Sharding Key: user_id
├─ Orders → sharded by buyer_id
├─ Cart → sharded by user_id
├─ Wishlist → sharded by user_id
├─ Messages → sharded by user_id
└─ Search History → sharded by user_id

Secondary Sharding Key: seller_id
├─ Products → sharded by seller_id
├─ Inventory → sharded by seller_id
└─ Seller Orders → sharded by seller_id

Time-based Partitioning (Global Tables):
├─ Orders → RANGE by created_at (monthly)
├─ Payments → RANGE by created_at (monthly)
├─ Messages → RANGE by created_at (yearly)
└─ Audit Logs → RANGE by timestamp (yearly)
```

### 1.2 Sharding Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Router/Proxy Layer                      │
│  (Compute sharding key, route queries to correct shard)   │
└──────────┬──────────────────────────────────────────────┘
           │
    ┌──────┴──────┬──────────┬──────────┬──────────┐
    │             │          │          │          │
┌─────────┐  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Shard 0 │  │ Shard 1 │ │ Shard 2 │ │ Shard 3 │ │ ...N    │
│ (0-250K)│  │(250K-   │ │(500K-   │ │(750K-   │ │ Shards  │
│ Users   │  │500K)    │ │750K)    │ │1M)      │ │         │
└─────────┘  └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 1.3 Sharding Implementation

#### Hash-Based Sharding

```java
package com.smartkrishi.config.sharding;

@Component
public class ShardingRouter {
    
    private static final int NUM_SHARDS = 64; // Can be increased to 256
    
    /**
     * Route query to correct shard based on user_id
     */
    public int getShardId(Long userId) {
        return (int) (userId % NUM_SHARDS);
    }
    
    /**
     * Get connection string for specific shard
     */
    public String getShardDataSourceUrl(Long userId) {
        int shardId = getShardId(userId);
        return String.format("jdbc:mysql://shard-%d.db.company.com:3306/smart_krishi", shardId);
    }
    
    /**
     * For seller-based queries
     */
    public int getSellerShardId(Long sellerId) {
        return (int) (sellerId % NUM_SHARDS);
    }
}

@Component
public class ShardingInterceptor implements RequestInterceptor {
    
    @Autowired
    private ShardingRouter shardingRouter;
    
    @Override
    public void intercept(RequestTemplate template) {
        // Extract user_id from context
        Long userId = SecurityContextHolder.getContext().getUserId();
        
        // Add shard header
        int shardId = shardingRouter.getShardId(userId);
        template.header("X-Shard-ID", String.valueOf(shardId));
    }
}
```

#### Shard Configuration

```yaml
# application.yml - Sharding Configuration
spring:
  sharding:
    enabled: true
    strategy: HASH
    sharding-key: user_id
    num-shards: 64
    shards:
      - id: 0
        host: shard-0.db.company.com
        port: 3306
        database: smart_krishi
        replica-hosts:
          - shard-0-replica-1.db.company.com
          - shard-0-replica-2.db.company.com
      - id: 1
        host: shard-1.db.company.com
        port: 3306
        database: smart_krishi
        replica-hosts:
          - shard-1-replica-1.db.company.com
          - shard-1-replica-2.db.company.com
      # ... continue for all 64 shards
```

### 1.4 Cross-Shard Queries

```java
/**
 * Handler for queries that span multiple shards
 */
@Component
public class CrossShardQueryHandler {
    
    @Autowired
    private ShardingRouter shardingRouter;
    
    /**
     * Execute query across all shards (e.g., for admin analytics)
     */
    public List<Order> getAllOrdersAcrossShards(OrderStatus status) {
        List<Order> results = new CopyOnWriteArrayList<>();
        ExecutorService executor = Executors.newFixedThreadPool(64);
        
        try {
            for (int shardId = 0; shardId < 64; shardId++) {
                executor.submit(() -> {
                    String dataSourceUrl = shardingRouter.getShardDataSourceUrl((long) shardId);
                    // Execute query on this shard
                    List<Order> shardResults = queryOrdersByStatus(dataSourceUrl, status);
                    results.addAll(shardResults);
                });
            }
            
            executor.shutdown();
            executor.awaitTermination(5, TimeUnit.MINUTES);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Cross-shard query interrupted", e);
        }
        
        return results;
    }
    
    /**
     * Execute distributed join across shards (expensive operation)
     */
    public Page<OrderDTO> getOrdersWithProductDetails(Long userId, Pageable pageable) {
        // 1. Get orders for user (single shard query - fast)
        Page<Order> orders = getOrdersByUser(userId, pageable);
        
        // 2. For each product_id, fetch from product shard (map-reduce style)
        Map<Long, Product> products = orders.stream()
            .flatMap(order -> order.getOrderItems().stream())
            .map(OrderItem::getProductId)
            .distinct()
            .collect(Collectors.toMap(
                Function.identity(),
                this::getProductFromProductShard
            ));
        
        // 3. Combine results in application layer
        return orders.map(order -> OrderDTO.builder()
                .order(order)
                .products(order.getOrderItems().stream()
                    .map(item -> products.get(item.getProductId()))
                    .collect(Collectors.toList()))
                .build());
    }
}
```

---

## 2. Vertical Partitioning

### 2.1 Hot/Cold Data Strategy

```
HOT DATA (MySQL Primary - 3-6 months):
├─ Active orders (PENDING, CONFIRMED, SHIPPED)
├─ Recent messages (last 30 days)
├─ Active inventory
├─ Recent reviews (last 6 months)
└─ Active sessions

WARM DATA (Archival MySQL - 6-24 months):
├─ Delivered orders (older than 6 months)
├─ Historical messages (30-365 days old)
├─ Completed transactions
└─ Inactive user profiles

COLD DATA (S3/Cloud Archive - 1+ years):
├─ Very old orders (> 2 years)
├─ Historical audit logs
├─ Archived messages
└─ Compliance data (7+ years for tax)
```

### 2.2 Data Archival Strategy

```sql
-- Archive orders older than 2 years
CREATE PROCEDURE archive_old_orders()
BEGIN
    INSERT INTO orders_archive 
    SELECT * FROM orders 
    WHERE order_status = 'DELIVERED' 
        AND created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);
    
    DELETE FROM orders 
    WHERE order_status = 'DELIVERED' 
        AND created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);
    
    -- Also archive related tables
    DELETE FROM order_items 
    WHERE order_id NOT IN (SELECT id FROM orders);
END;

-- Schedule weekly
-- 0 2 * * 0 /usr/local/bin/mysql-archive-script.sh
```

### 2.3 Application-Level TTL Management

```java
@Component
@Scheduled(cron = "0 2 * * * ?") // 2 AM daily
public class DataArchivalService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private S3Service s3Service;
    
    @Transactional
    public void archiveOldData() {
        LocalDateTime twoYearsAgo = LocalDateTime.now().minusYears(2);
        
        // Find old orders
        List<Order> oldOrders = orderRepository
            .findByOrderStatusAndCreatedAtBefore(
                Order.OrderStatus.DELIVERED, 
                twoYearsAgo
            );
        
        // Backup to S3 before deleting
        for (Order order : oldOrders) {
            String json = objectMapper.writeValueAsString(order);
            String s3Key = String.format("orders/archive/%d/%s.json", 
                order.getId(), order.getOrderNumber());
            s3Service.putObject("smart-krishi-archive", s3Key, json);
        }
        
        // Delete from primary database
        orderRepository.deleteAll(oldOrders);
        
        logger.info("Archived {} orders to S3", oldOrders.size());
    }
}
```

---

## 3. Read Replicas & Read/Write Splitting

### 3.1 Replication Architecture

```
┌──────────────────────┐
│  Primary (Write)     │
│  - Handle all writes │
│  - 5 minute lag      │
└──────────┬───────────┘
           │ Binlog
     ┌─────┴────────────────────┐
     │                          │
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│ Replica 1      │    │ Replica 2      │    │ Replica 3      │
│ (Read-Heavy)   │    │ (Analytics)    │    │ (Reporting)    │
│ - User reads   │    │ - Dashboards   │    │ - BI queries   │
│ - Product info │    │ - Metrics      │    │ - Exports      │
└────────────────┘    └────────────────┘    └────────────────┘

Monitoring: 
- Replica lag < 100ms (alerting at 500ms)
- Replication thread status checked every 10s
```

### 3.2 Spring Boot Configuration

```java
@Configuration
public class DataSourceConfig {
    
    /**
     * Primary data source (Write Operations)
     */
    @Bean(name = "primaryDataSource")
    @Primary
    public DataSource primaryDataSource(
        @Value("${spring.datasource.primary.url}") String url,
        @Value("${spring.datasource.primary.username}") String username,
        @Value("${spring.datasource.primary.password}") String password
    ) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        return new HikariDataSource(config);
    }
    
    /**
     * Read replica data source
     */
    @Bean(name = "replicaDataSource")
    public DataSource replicaDataSource(
        @Value("${spring.datasource.replica.url}") String url,
        @Value("${spring.datasource.replica.username}") String username,
        @Value("${spring.datasource.replica.password}") String password
    ) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(30);  // More connections for read-heavy
        config.setMinimumIdle(10);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setReadOnly(true);  // Read-only connection
        return new HikariDataSource(config);
    }
    
    /**
     * Routing data source for read/write splitting
     */
    @Bean
    public DataSource routingDataSource(
        @Qualifier("primaryDataSource") DataSource primary,
        @Qualifier("replicaDataSource") DataSource replica
    ) {
        return new LazyConnectionDataSourceProxy(
            new RoutingDataSource(primary, replica)
        );
    }
}

/**
 * Custom routing data source
 */
public class RoutingDataSource extends AbstractRoutingDataSource {
    
    private final DataSource primary;
    private final DataSource replica;
    
    public RoutingDataSource(DataSource primary, DataSource replica) {
        this.primary = primary;
        this.replica = replica;
        
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put("PRIMARY", primary);
        targetDataSources.put("REPLICA", replica);
        
        setTargetDataSources(targetDataSources);
        setDefaultTargetDataSource(primary);
    }
    
    @Override
    protected Object determineCurrentLookupKey() {
        return DataSourceContext.getDataSource();
    }
}

/**
 * Thread-local context for data source selection
 */
public class DataSourceContext {
    
    private static final ThreadLocal<String> context = 
        ThreadLocal.withInitial(() -> "PRIMARY");
    
    public static void usePrimary() {
        context.set("PRIMARY");
    }
    
    public static void useReplica() {
        context.set("REPLICA");
    }
    
    public static String getDataSource() {
        return context.get();
    }
    
    public static void clear() {
        context.remove();
    }
}

/**
 * AOP aspect for automatic read/write splitting
 */
@Aspect
@Component
public class DataSourceRoutingAspect {
    
    @Before("@annotation(readOnly)")
    public void routeToReplica(JoinPoint joinPoint, Transactional transactional) {
        if (transactional.readOnly()) {
            DataSourceContext.useReplica();
        } else {
            DataSourceContext.usePrimary();
        }
    }
    
    @After("execution(* com.smartkrishi.service.*.*(..))")
    public void clearDataSource() {
        DataSourceContext.clear();
    }
}
```

### 3.3 Service Layer Usage

```java
@Service
@RequiredArgsConstructor
public class ProductService {
    
    private final ProductRepository productRepository;
    
    /**
     * Read from replica (safe for reads)
     */
    @Transactional(readOnly = true)
    public Page<ProductDTO> searchProducts(String keyword, Pageable pageable) {
        // Automatically routed to replica
        return productRepository.searchByKeyword(keyword, pageable)
                .map(this::convertToDTO);
    }
    
    /**
     * Write to primary
     */
    @Transactional(readOnly = false)
    public ProductDTO createProduct(ProductDTO dto) {
        // Automatically routed to primary
        Product product = new Product();
        // ... map DTO to entity
        return convertToDTO(productRepository.save(product));
    }
}
```

---

## 4. Caching Strategy

### 4.1 Multi-Layer Caching

```
L1: Redis Cache (Hot Data)
├─ Session cache (TTL: Session duration)
├─ User profiles (TTL: 1 hour)
├─ Product details (TTL: 6 hours)
├─ Category listings (TTL: 24 hours)
└─ Search results (TTL: 30 minutes)

L2: Local Cache (In-App)
├─ Category hierarchy (TTL: 1 day)
├─ Configuration settings (TTL: 1 day)
└─ Feature flags (TTL: 5 minutes)

L3: CDN (Static Content)
├─ Product images
├─ Videos
└─ Frontend assets
```

### 4.2 Redis Configuration

```java
@Configuration
public class RedisConfig {
    
    @Bean
    public LettuceConnectionFactory connectionFactory() {
        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofSeconds(2))
                .shutdownTimeout(Duration.ofSeconds(5))
                .useSsl().and()
                .build();
        
        return new LettuceConnectionFactory(clientConfig);
    }
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        
        Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer = new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.NON_FINAL);
        jackson2JsonRedisSerializer.setObjectMapper(objectMapper);
        
        StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();
        
        // String key-value
        template.setKeySerializer(stringRedisSerializer);
        template.setValueSerializer(jackson2JsonRedisSerializer);
        
        // Hash key-value
        template.setHashKeySerializer(stringRedisSerializer);
        template.setHashValueSerializer(jackson2JsonRedisSerializer);
        
        template.afterPropertiesSet();
        return template;
    }
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new Jackson2JsonRedisSerializer<>(Object.class)));
        
        return RedisCacheManager.create(factory);
    }
}
```

### 4.3 Cache Usage

```java
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    
    /**
     * Get user with caching
     */
    @Cacheable(value = "user", key = "#userId", unless = "#result == null")
    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }
    
    /**
     * Update user and invalidate cache
     */
    @CacheEvict(value = "user", key = "#user.id")
    @Transactional
    public User updateUser(User user) {
        return userRepository.save(user);
    }
    
    /**
     * Manual cache management for complex logic
     */
    public Page<ProductDTO> getRecommendedProducts(Long userId, Pageable pageable) {
        String cacheKey = "recommendations:" + userId;
        
        // Check cache
        @SuppressWarnings("unchecked")
        List<ProductDTO> cached = (List<ProductDTO>) redisTemplate
                .opsForValue()
                .get(cacheKey);
        
        if (cached != null && !cached.isEmpty()) {
            return new PageImpl<>(cached, pageable, cached.size());
        }
        
        // Fetch from database
        List<ProductDTO> recommendations = fetchRecommendationsFromDB(userId, pageable);
        
        // Cache for 24 hours
        redisTemplate.opsForValue().set(cacheKey, recommendations, Duration.ofHours(24));
        
        return new PageImpl<>(recommendations, pageable, recommendations.size());
    }
}
```

---

## 5. Query Optimization

### 5.1 Index Strategy

```sql
-- B-Tree Indexes (Most Common)
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_orders_buyer_status ON orders(buyer_id, order_status);

-- Full-Text Indexes (Search)
CREATE FULLTEXT INDEX idx_product_search ON products(product_name, product_description);

-- Spatial Indexes (Geolocation)
CREATE SPATIAL INDEX idx_land_location ON land_listings(geolocation);

-- Composite Indexes (Multiple Columns)
CREATE INDEX idx_order_buyer_created ON orders(buyer_id, created_at DESC);

-- Covering Indexes (All columns in index)
CREATE INDEX idx_product_cover ON products(seller_id, status) INCLUDE (price, rating);
```

### 5.2 Query Optimization

```java
// ❌ Bad: N+1 Query Problem
@Transactional(readOnly = true)
public List<OrderDTO> getUserOrders(Long userId) {
    List<Order> orders = orderRepository.findByBuyerId(userId);
    
    return orders.stream()
            .map(order -> {
                // This causes N additional queries
                OrderDTO dto = new OrderDTO();
                dto.setItems(order.getOrderItems()); // Lazy loaded!
                return dto;
            })
            .collect(Collectors.toList());
}

// ✅ Good: Use JOIN FETCH or projection
@Query("SELECT new com.smartkrishi.dto.OrderDTO(o.id, o.orderNumber, COUNT(oi.id)) " +
        "FROM Order o LEFT JOIN o.orderItems oi " +
        "WHERE o.buyer.id = :userId " +
        "GROUP BY o.id")
List<OrderDTO> getUserOrdersOptimized(@Param("userId") Long userId);

// ✅ Better: Use @EntityGraph
@EntityGraph(attributePaths = {"orderItems", "payment"})
List<Order> findByBuyerId(Long buyerId);

// ✅ Best: Use Projection for specific fields
@Query("SELECT new com.smartkrishi.dto.OrderSummaryDTO(" +
        "o.id, o.orderNumber, o.totalAmount, COUNT(oi.id)) " +
        "FROM Order o LEFT JOIN o.orderItems oi " +
        "WHERE o.buyer.id = :userId " +
        "GROUP BY o.id")
Page<OrderSummaryDTO> findOrdersSummary(@Param("userId") Long userId, Pageable pageable);
```

### 5.3 Pagination Best Practices

```java
// ❌ Bad: OFFSET-based (slow for large pages)
Page<Order> orders = orderRepository.findByBuyerId(userId, PageRequest.of(1000, 20));

// ✅ Good: Keyset pagination (cursor-based)
@Query("SELECT o FROM Order o WHERE o.buyer.id = :userId AND o.id > :lastId ORDER BY o.id LIMIT :pageSize")
List<Order> findOrdersAfter(@Param("userId") Long userId, @Param("lastId") Long lastId, @Param("pageSize") int pageSize);

// Usage
public Page<OrderDTO> getOrdersKeysetPagination(Long userId, Long lastSeenId, int pageSize) {
    List<Order> orders = orderRepository.findOrdersAfter(userId, lastSeenId, pageSize + 1);
    
    boolean hasNext = orders.size() > pageSize;
    if (hasNext) {
        orders = orders.subList(0, pageSize);
    }
    
    return new PageImpl<>(
        orders.stream().map(this::convertToDTO).collect(Collectors.toList()),
        PageRequest.of(0, pageSize),
        hasNext ? orders.get(orders.size() - 1).getId() : 0
    );
}
```

---

## 6. Monitoring & Alerting

### 6.1 Metrics Collection

```java
@Component
public class DatabaseMetricsCollector {
    
    private final MeterRegistry meterRegistry;
    private final JdbcTemplate jdbcTemplate;
    
    @Autowired
    public DatabaseMetricsCollector(MeterRegistry meterRegistry, JdbcTemplate jdbcTemplate) {
        this.meterRegistry = meterRegistry;
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @Scheduled(fixedRate = 10000) // Every 10 seconds
    public void collectMetrics() {
        // Replica lag
        List<Map<String, Object>> replicaStatus = jdbcTemplate.queryForList("SHOW SLAVE STATUS");
        if (!replicaStatus.isEmpty()) {
            Long secondsBehindMaster = (Long) replicaStatus.get(0).get("Seconds_Behind_Master");
            meterRegistry.gauge("database.replica.lag.seconds", secondsBehindMaster);
        }
        
        // Connection pool metrics
        meterRegistry.gauge("database.connections.active", getActiveConnections());
        meterRegistry.gauge("database.connections.idle", getIdleConnections());
        
        // Query performance
        meterRegistry.gauge("database.queries.slow", getSlowQueryCount());
    }
    
    @Scheduled(fixedRate = 60000) // Every minute
    public void collectTableMetrics() {
        // Table sizes
        String query = "SELECT table_name, ROUND(((data_length+index_length)/1024/1024),2) AS size_mb " +
                       "FROM information_schema.tables WHERE table_schema = 'smart_krishi'";
        
        List<Map<String, Object>> results = jdbcTemplate.queryForList(query);
        
        for (Map<String, Object> row : results) {
            String tableName = (String) row.get("table_name");
            Double sizeMb = (Double) row.get("size_mb");
            
            meterRegistry.gauge("database.table.size.mb", 
                Tags.of("table", tableName), 
                sizeMb);
        }
    }
}
```

### 6.2 Health Checks

```java
@Component
public class DatabaseHealthIndicator extends AbstractHealthIndicator {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Override
    protected void doHealthCheck(Health.Builder builder) {
        try {
            // Check primary connection
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            
            // Check replica lag
            List<Map<String, Object>> replicaStatus = jdbcTemplate.queryForList("SHOW SLAVE STATUS");
            if (!replicaStatus.isEmpty()) {
                Long lag = (Long) replicaStatus.get(0).get("Seconds_Behind_Master");
                
                if (lag > 500) {
                    builder.down()
                            .withDetail("replica_lag_seconds", lag)
                            .withDetail("status", "Replica lag exceeded threshold");
                } else {
                    builder.up()
                            .withDetail("replica_lag_seconds", lag);
                }
            }
        } catch (Exception e) {
            builder.down()
                    .withDetail("error", e.getMessage());
        }
    }
}
```

### 6.3 Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: database
    rules:
      - alert: ReplicaLagHigh
        expr: database_replica_lag_seconds > 500
        for: 5m
        annotations:
          summary: "Database replica lag is {{ $value }} seconds"
      
      - alert: SlowQueriesHigh
        expr: increase(database_queries_slow[5m]) > 10
        for: 5m
        annotations:
          summary: "More than 10 slow queries in 5 minutes"
      
      - alert: ConnectionPoolExhausted
        expr: database_connections_active / database_connections_max > 0.9
        for: 5m
        annotations:
          summary: "Database connection pool {{ $value | humanizePercentage }} exhausted"
      
      - alert: DiskSpaceLow
        expr: database_table_size_mb > 40000
        for: 5m
        annotations:
          summary: "Database size exceeds 40GB, archive old data"
```

---

## 7. Production Deployment Checklist

### 7.1 Pre-Deployment

- [ ] Backup current production database
- [ ] Test migration scripts on staging environment
- [ ] Performance test on staging with production-like data
- [ ] Create rollback plan
- [ ] Notify stakeholders of maintenance window
- [ ] Document any breaking changes

### 7.2 Deployment

- [ ] Enable read-only mode
- [ ] Stop accepting new writes
- [ ] Run DDL migrations
- [ ] Verify data consistency
- [ ] Update application configuration
- [ ] Roll out application updates
- [ ] Run smoke tests
- [ ] Monitor error rates and latency
- [ ] Enable normal operations

### 7.3 Post-Deployment

- [ ] Monitor metrics for 24 hours
- [ ] Verify backup integrity
- [ ] Document any issues encountered
- [ ] Update runbooks
- [ ] Schedule post-mortem if needed

---

## 8. Disaster Recovery

### 8.1 Backup Strategy

```bash
#!/bin/bash
# Daily backup script

BACKUP_DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/smart-krishi/$BACKUP_DATE"

mkdir -p $BACKUP_DIR

# Full backup (weekly)
if [ $(date +%w) -eq 0 ]; then
    mysqldump -u root -p$DB_PASSWORD --all-databases > $BACKUP_DIR/full_backup.sql
    gzip $BACKUP_DIR/full_backup.sql
fi

# Incremental backup (daily)
mysqlbinlog /var/lib/mysql/mysql-bin.* > $BACKUP_DIR/incremental_backup.sql

# Upload to S3
aws s3 cp $BACKUP_DIR s3://smart-krishi-backups/$BACKUP_DATE/ --recursive

# Clean old backups (retention: 30 days)
find /backup/smart-krishi -type d -mtime +30 -exec rm -rf {} \;
```

### 8.2 Recovery Procedures

```sql
-- Point-in-time recovery
-- 1. Restore from full backup
mysql < /backup/smart-krishi/20240101/full_backup.sql

-- 2. Apply binary logs up to desired timestamp
mysqlbinlog --stop-datetime="2024-01-15 14:00:00" /var/lib/mysql/mysql-bin.* | mysql

-- 3. Verify data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders;
```

---

## 9. Performance Benchmarking

### 9.1 Benchmark Queries

```java
@Component
public class PerformanceBenchmark {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private MeterRegistry meterRegistry;
    
    @Scheduled(fixedRate = 3600000) // Hourly
    public void runBenchmarks() {
        // Benchmark: Product search
        Instant start = Instant.now();
        productRepository.searchByKeyword("fertilizer", PageRequest.of(0, 20));
        Duration duration = Duration.between(start, Instant.now());
        
        meterRegistry.timer("benchmark.product.search")
                .record(duration);
        
        // Benchmark: Get user orders
        start = Instant.now();
        productRepository.findBySellerIdAndProductStatus(1L, 
            Product.ProductStatus.ACTIVE, 
            PageRequest.of(0, 50));
        duration = Duration.between(start, Instant.now());
        
        meterRegistry.timer("benchmark.product.list")
                .record(duration);
    }
}
```

---

## 10. Summary & Recommendations

### For 1M Users:
1. **Implement sharding** with 64-256 shards based on user_id
2. **Use read replicas** for read-heavy operations (3+ replicas)
3. **Implement caching** with Redis for hot data
4. **Archive old data** to cold storage after 2 years
5. **Monitor metrics** with Prometheus + Grafana
6. **Test failover** procedures monthly

### Expected Performance:
- **p50 latency**: < 100ms
- **p95 latency**: < 500ms
- **p99 latency**: < 1s
- **Throughput**: 10,000+ req/sec
- **Storage**: 30-40 GB
- **Backup time**: < 2 hours
- **Recovery time**: < 4 hours

### Estimated Cost:
- **Primary DB**: $2,000/month (32GB RAM, 8 vCPU)
- **3 Read Replicas**: $1,500/month each = $4,500/month
- **Redis Cache**: $500/month
- **S3 Storage**: $1,000/month (archives)
- **Total**: ~$8,000/month for production-grade setup
