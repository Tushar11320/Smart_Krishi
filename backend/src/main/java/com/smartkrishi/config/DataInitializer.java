package com.smartkrishi.config;

import com.smartkrishi.entity.Role;
import com.smartkrishi.entity.User;
import com.smartkrishi.entity.Category;
import com.smartkrishi.entity.SellerProfile;
import com.smartkrishi.entity.Product;
import com.smartkrishi.entity.ProductInventory;
import com.smartkrishi.entity.Fertilizer;

import com.smartkrishi.repository.RoleRepository;
import com.smartkrishi.repository.UserRepository;
import com.smartkrishi.repository.CategoryRepository;
import com.smartkrishi.repository.SellerProfileRepository;
import com.smartkrishi.repository.ProductRepository;
import com.smartkrishi.repository.ProductInventoryRepository;
import com.smartkrishi.repository.FertilizerRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.hibernate.Session;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

import java.util.HashSet;
import java.util.Set;

@Configuration
@AllArgsConstructor
@Slf4j
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final jakarta.persistence.EntityManager entityManager;
    private final PlatformTransactionManager transactionManager;
    private final CategoryRepository categoryRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductRepository productRepository;
    private final ProductInventoryRepository productInventoryRepository;
    private final FertilizerRepository fertilizerRepository;

    private boolean isH2Database() {
        try {
            return entityManager.unwrap(Session.class).doReturningWork(connection -> {
                String dbProduct = connection.getMetaData().getDatabaseProductName();
                return dbProduct != null && dbProduct.toLowerCase().contains("h2");
            });
        } catch (Exception e) {
            return false;
        }
    }

    private boolean tableExists(String tableName) {
        try {
            return entityManager.unwrap(Session.class).doReturningWork(connection -> {
                DatabaseMetaData metaData = connection.getMetaData();
                try (ResultSet rs = metaData.getTables(null, null, tableName, null)) {
                    if (rs.next()) return true;
                }
                try (ResultSet rs = metaData.getTables(null, null, tableName.toUpperCase(), null)) {
                    if (rs.next()) return true;
                }
                try (ResultSet rs = metaData.getTables(null, null, tableName.toLowerCase(), null)) {
                    if (rs.next()) return true;
                }
                return false;
            });
        } catch (Exception e) {
            return false;
        }
    }

    private boolean columnExists(String tableName, String columnName) {
        try {
            return entityManager.unwrap(Session.class).doReturningWork(connection -> {
                DatabaseMetaData metaData = connection.getMetaData();
                try (ResultSet rs = metaData.getColumns(null, null, tableName, columnName)) {
                    if (rs.next()) return true;
                }
                try (ResultSet rs = metaData.getColumns(null, null, tableName.toUpperCase(), columnName.toUpperCase())) {
                    if (rs.next()) return true;
                }
                try (ResultSet rs = metaData.getColumns(null, null, tableName.toLowerCase(), columnName.toLowerCase())) {
                    if (rs.next()) return true;
                }
                return false;
            });
        } catch (Exception e) {
            return false;
        }
    }

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
            
            // Migrate legacy roles in the database if they exist
            try {
                if (tableExists("roles") && columnExists("roles", "role_type")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery("UPDATE roles SET role_type = 'ROLE_USER' WHERE CAST(role_type AS CHAR) = 'BUYER'").executeUpdate();
                        entityManager.createNativeQuery("UPDATE roles SET role_type = 'ROLE_SELLER' WHERE CAST(role_type AS CHAR) = 'SELLER'").executeUpdate();
                        entityManager.createNativeQuery("UPDATE roles SET role_type = 'ROLE_ADMIN' WHERE CAST(role_type AS CHAR) = 'ADMIN'").executeUpdate();
                        entityManager.createNativeQuery("UPDATE roles SET role_type = 'ROLE_SUPER_ADMIN' WHERE CAST(role_type AS CHAR) = 'SUPER_ADMIN'").executeUpdate();
                        return null;
                    });
                    log.info("Successfully migrated legacy roles in the database to ROLE_ prefixed ones.");
                }
            } catch (Exception e) {
                log.debug("Roles migration skipped: " + e.getMessage());
            }

            // Alter seller_status column to support 'APPROVED' instead of old 'VERIFIED'
            try {
                if (tableExists("seller_profiles") && columnExists("seller_profiles", "seller_status")) {
                    transactionTemplate.execute(status -> {
                        // 1. Update any existing VERIFIED status to APPROVED to prevent truncation during schema alter
                        entityManager.createNativeQuery(
                            "UPDATE seller_profiles SET seller_status = 'APPROVED' WHERE CAST(seller_status AS CHAR) = 'VERIFIED'"
                        ).executeUpdate();
                        return null;
                    });
                    log.info("Successfully updated legacy 'VERIFIED' status to 'APPROVED' in seller_profiles.");
                }
            } catch (Exception e) {
                log.debug("Legacy status update skipped: " + e.getMessage());
            }

            try {
                if (!isH2Database() && tableExists("seller_profiles") && columnExists("seller_profiles", "seller_status")) {
                    transactionTemplate.execute(status -> {
                        // 2. Modify enum to include 'APPROVED'
                        entityManager.createNativeQuery(
                            "ALTER TABLE seller_profiles MODIFY COLUMN seller_status ENUM('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED') DEFAULT 'PENDING'"
                        ).executeUpdate();
                        return null;
                    });
                    log.info("Database column seller_profiles.seller_status successfully updated to support APPROVED.");
                }
            } catch (Exception e) {
                log.warn("Database column update warning (already updated or non-MySQL): " + e.getMessage());
            }

            try {
                if (tableExists("crops") && !columnExists("crops", "variety")) {
                    transactionTemplate.execute(status -> {
                        // 3. Add crop marketplace fields
                        entityManager.createNativeQuery("ALTER TABLE crops ADD COLUMN variety VARCHAR(255) NULL").executeUpdate();
                        return null;
                    });
                    log.info("Database column crops.variety successfully added.");
                }
            } catch (Exception e) {
                log.debug("Column crops.variety already exists or error: " + e.getMessage());
            }

            try {
                if (tableExists("crops") && !columnExists("crops", "unit")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery("ALTER TABLE crops ADD COLUMN unit VARCHAR(50) NULL").executeUpdate();
                        return null;
                    });
                    log.info("Database column crops.unit successfully added.");
                }
            } catch (Exception e) {
                log.debug("Column crops.unit already exists or error: " + e.getMessage());
            }

            try {
                if (tableExists("crops") && !columnExists("crops", "harvest_date")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery("ALTER TABLE crops ADD COLUMN harvest_date DATE NULL").executeUpdate();
                        return null;
                    });
                    log.info("Database column crops.harvest_date successfully added.");
                }
            } catch (Exception e) {
                log.debug("Column crops.harvest_date already exists or error: " + e.getMessage());
            }

            try {
                if (tableExists("crops") && !columnExists("crops", "location")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery("ALTER TABLE crops ADD COLUMN location VARCHAR(255) NULL").executeUpdate();
                        return null;
                    });
                    log.info("Database column crops.location successfully added.");
                }
            } catch (Exception e) {
                log.debug("Column crops.location already exists or error: " + e.getMessage());
            }

            try {
                if (!isH2Database() && tableExists("categories") && columnExists("categories", "category_slug")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery("ALTER TABLE categories MODIFY COLUMN category_slug VARCHAR(255) NULL").executeUpdate();
                        return null;
                    });
                    log.info("Database column categories.category_slug successfully made nullable.");
                }
            } catch (Exception e) {
                log.debug("Column categories.category_slug already nullable or error: " + e.getMessage());
            }

            try {
                if (!isH2Database() && tableExists("products") && columnExists("products", "subcategory_id")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery("ALTER TABLE products MODIFY COLUMN subcategory_id BIGINT NULL").executeUpdate();
                        return null;
                    });
                    log.info("Database column products.subcategory_id successfully made nullable.");
                }
            } catch (Exception e) {
                log.debug("Column products.subcategory_id already nullable or error: " + e.getMessage());
            }

            try {
                if (!isH2Database() && tableExists("fertilizers") && columnExists("fertilizers", "fertilizer_type")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery("ALTER TABLE fertilizers MODIFY COLUMN fertilizer_type VARCHAR(100) NULL").executeUpdate();
                        return null;
                    });
                    log.info("Database column fertilizers.fertilizer_type successfully made nullable.");
                }
            } catch (Exception e) {
                log.debug("Column fertilizers.fertilizer_type already nullable or error: " + e.getMessage());
            }

            // Fix cart_items: user_id is not mapped by JPA CartItem entity (resolved via cart_id -> carts.buyer_id)
            try {
                if (!isH2Database() && tableExists("cart_items") && columnExists("cart_items", "user_id")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery("ALTER TABLE cart_items MODIFY COLUMN user_id BIGINT NULL").executeUpdate();
                        return null;
                    });
                    log.info("Database column cart_items.user_id successfully made nullable (not mapped by JPA).");
                }
            } catch (Exception e) {
                log.debug("Column cart_items.user_id already nullable or error: " + e.getMessage());
            }

            // Fix cart_items: save_for_later needs a default value for JPA inserts
            try {
                if (!isH2Database() && tableExists("cart_items") && columnExists("cart_items", "save_for_later")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery("ALTER TABLE cart_items ALTER COLUMN save_for_later SET DEFAULT 0").executeUpdate();
                        return null;
                    });
                    log.info("Database column cart_items.save_for_later default set to 0.");
                }
            } catch (Exception e) {
                log.debug("Column cart_items.save_for_later default already set or error: " + e.getMessage());
            }

            // Fix carts: set datetime defaults so @CreationTimestamp/@UpdateTimestamp work
            try {
                if (!isH2Database() && tableExists("carts") && columnExists("carts", "created_at")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery(
                            "ALTER TABLE carts MODIFY COLUMN created_at DATETIME(6) NOT NULL DEFAULT NOW(6)"
                        ).executeUpdate();
                        return null;
                    });
                    log.info("Database column carts.created_at default set to NOW(6).");
                }
            } catch (Exception e) {
                log.debug("Column carts.created_at default already set or error: " + e.getMessage());
            }

            try {
                if (!isH2Database() && tableExists("carts") && columnExists("carts", "updated_at")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery(
                            "ALTER TABLE carts MODIFY COLUMN updated_at DATETIME(6) NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6)"
                        ).executeUpdate();
                        return null;
                    });
                    log.info("Database column carts.updated_at default set to NOW(6) with ON UPDATE.");
                }
            } catch (Exception e) {
                log.debug("Column carts.updated_at default already set or error: " + e.getMessage());
            }

            // Fix feedbacks & task priority column: alter to ENUM in MySQL
            try {
                if (!isH2Database() && tableExists("feedbacks") && columnExists("feedbacks", "priority")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery(
                            "ALTER TABLE feedbacks MODIFY COLUMN priority ENUM('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM'"
                        ).executeUpdate();
                        return null;
                    });
                    log.info("Database column feedbacks.priority successfully updated to ENUM.");
                }
            } catch (Exception e) {
                log.warn("Database column feedbacks.priority update warning: " + e.getMessage());
            }

            try {
                if (!isH2Database() && tableExists("task") && columnExists("task", "priority")) {
                    transactionTemplate.execute(status -> {
                        entityManager.createNativeQuery(
                            "ALTER TABLE task MODIFY COLUMN priority ENUM('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM'"
                        ).executeUpdate();
                        return null;
                    });
                    log.info("Database column task.priority successfully updated to ENUM.");
                }
            } catch (Exception e) {
                log.warn("Database column task.priority update warning: " + e.getMessage());
            }


            transactionTemplate.execute(status -> {
                String[] standardCategories = {
                    "Crops", "Machinery", "Fertilizers", "Dairy Products", "Farming Equipment", "Building Materials", "Water Supply"
                };
                for (String catName : standardCategories) {
                    if (categoryRepository.findByCategoryName(catName).isEmpty()) {
                        Category cat = new Category();
                        cat.setCategoryName(catName);
                        cat.setDescription(catName + " Category");
                        cat.setIsActive(true);
                        cat.setDisplayOrder(0);
                        categoryRepository.save(cat);
                        log.info("Seeded category: {}", catName);
                    }
                }
                return null;
            });

            // Seed roles
            transactionTemplate.execute(status -> {
                if (roleRepository.count() == 0 || roleRepository.findByRoleType(Role.RoleType.ROLE_USER).isEmpty()) {
                    log.info("Seeding/updating roles...");
                    
                    Role buyerRole = roleRepository.findByRoleType(Role.RoleType.ROLE_USER)
                            .orElseGet(Role::new);
                    buyerRole.setRoleType(Role.RoleType.ROLE_USER);
                    buyerRole.setDescription("User role for standard actions");
                    roleRepository.save(buyerRole);

                    Role sellerRole = roleRepository.findByRoleType(Role.RoleType.ROLE_SELLER)
                            .orElseGet(Role::new);
                    sellerRole.setRoleType(Role.RoleType.ROLE_SELLER);
                    sellerRole.setDescription("Seller role for listing and selling products");
                    roleRepository.save(sellerRole);

                    Role adminRole = roleRepository.findByRoleType(Role.RoleType.ROLE_ADMIN)
                            .orElseGet(Role::new);
                    adminRole.setRoleType(Role.RoleType.ROLE_ADMIN);
                    adminRole.setDescription("Administrator role with full access");
                    roleRepository.save(adminRole);

                    Role superAdminRole = roleRepository.findByRoleType(Role.RoleType.ROLE_SUPER_ADMIN)
                            .orElseGet(Role::new);
                    superAdminRole.setRoleType(Role.RoleType.ROLE_SUPER_ADMIN);
                    superAdminRole.setDescription("Super administrator role");
                    roleRepository.save(superAdminRole);

                    log.info("Roles seeded successfully: ROLE_USER, ROLE_SELLER, ROLE_ADMIN, ROLE_SUPER_ADMIN");
                }
                return null;
            });

            // Seed admin user
            transactionTemplate.execute(status -> {
                if (!userRepository.existsByEmail("admin@smartkrishi.com")) {
                    log.info("Creating admin user...");

                    User admin = new User();
                    admin.setEmail("admin@smartkrishi.com");
                    admin.setPhone("9999999999");
                    admin.setFirstName("Admin");
                    admin.setLastName("SmartKrishi");
                    admin.setPasswordHash(passwordEncoder.encode("Admin@1234"));
                    admin.setUserStatus(User.UserStatus.ACTIVE);
                    admin.setEmailVerified(true);
                    admin.setPhoneVerified(true);

                    Set<Role> adminRoles = new HashSet<>();
                    roleRepository.findByRoleType(Role.RoleType.ROLE_ADMIN).ifPresent(adminRoles::add);
                    roleRepository.findByRoleType(Role.RoleType.ROLE_USER).ifPresent(adminRoles::add);
                    admin.setRoles(adminRoles);

                    userRepository.save(admin);
                    log.info("Admin user created: admin@smartkrishi.com / Admin@1234");
                }
                return null;
            });

            // Seed seller user & profile
            final User[] sellerHolder = new User[1];
            transactionTemplate.execute(status -> {
                if (!userRepository.existsByEmail("seller@smartkrishi.com")) {
                    log.info("Creating seller user...");
                    User seller = new User();
                    seller.setEmail("seller@smartkrishi.com");
                    seller.setPhone("8888888888");
                    seller.setFirstName("Rajesh");
                    seller.setLastName("Kumar");
                    seller.setPasswordHash(passwordEncoder.encode("Seller@1234"));
                    seller.setUserStatus(User.UserStatus.ACTIVE);
                    seller.setEmailVerified(true);
                    seller.setPhoneVerified(true);

                    Set<Role> sellerRoles = new HashSet<>();
                    roleRepository.findByRoleType(Role.RoleType.ROLE_SELLER).ifPresent(sellerRoles::add);
                    roleRepository.findByRoleType(Role.RoleType.ROLE_USER).ifPresent(sellerRoles::add);
                    seller.setRoles(sellerRoles);

                    User savedSeller = userRepository.save(seller);
                    sellerHolder[0] = savedSeller;

                    SellerProfile profile = new SellerProfile();
                    profile.setUser(savedSeller);
                    profile.setBusinessName("Krishi Fertilizers & Seeds");
                    profile.setBusinessDescription("All varieties of organic and chemical fertilizers.");
                    profile.setSellerStatus(SellerProfile.SellerStatus.APPROVED);
                    profile.setDistrict("Patna");
                    profile.setState("Bihar");
                    profile.setPincode("800001");
                    sellerProfileRepository.save(profile);
                    log.info("Seller user & profile created: seller@smartkrishi.com / Seller@1234");
                } else {
                    sellerHolder[0] = userRepository.findByEmail("seller@smartkrishi.com").orElse(null);
                }
                return null;
            });

            // Seed fertilizer product - Disabled for client handover to ensure database starts in a clean state
            log.info("Default fertilizer product seeding disabled for production/handover.");
        };
    }
}

