package com.smartkrishi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url}")
    private String defaultUrl;

    @Value("${spring.datasource.username:}")
    private String defaultUsername;

    @Value("${spring.datasource.password:}")
    private String defaultPassword;

    @Value("${spring.datasource.driver-class-name:com.mysql.cj.jdbc.Driver}")
    private String defaultDriver;

    @Value("${spring.profiles.active:local}")
    private String activeProfile;

    @Bean
    @Primary
    public DataSource dataSource() {
        log.info("Initializing DataSource. Active profile: {}", activeProfile);
        
        String dbUrl = defaultUrl;
        String username = defaultUsername;
        String password = defaultPassword;
        String driverClassName = defaultDriver;

        // Only look up DATABASE_URL when the active profile is not local
        if (!"local".equals(activeProfile)) {
            String envDbUrl = System.getenv("DATABASE_URL");
            if (envDbUrl == null) {
                envDbUrl = System.getProperty("DATABASE_URL");
            }

            if (envDbUrl != null && !envDbUrl.trim().isEmpty()) {
                dbUrl = envDbUrl;
                log.info("DATABASE_URL env override found: {}", maskUrl(dbUrl));
            }
        }

        if (dbUrl != null && (dbUrl.startsWith("mysql://") || dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))) {
            try {
                URI dbUri = new URI(dbUrl);
                String scheme = dbUri.getScheme();
                String userInfo = dbUri.getUserInfo();
                
                if (userInfo != null && userInfo.contains(":")) {
                    String[] userParts = userInfo.split(":", 2);
                    username = userParts[0];
                    password = userParts[1];
                }

                String host = dbUri.getHost();
                int port = dbUri.getPort();
                String path = dbUri.getPath();

                if (scheme.startsWith("mysql")) {
                    if (port == -1) {
                        port = 3306;
                    }
                    dbUrl = "jdbc:mysql://" + host + ":" + port + path
                            + "?useSSL=true&requireSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true";
                    driverClassName = "com.mysql.cj.jdbc.Driver";
                } else if (scheme.startsWith("postgres")) {
                    if (port == -1) {
                        port = 5432;
                    }
                    dbUrl = "jdbc:postgresql://" + host + ":" + port + path + "?sslmode=require";
                    driverClassName = "org.postgresql.Driver";
                }
            } catch (URISyntaxException e) {
                log.error("Failed to parse DATABASE_URL: {}. Falling back to defaults.", e.getMessage());
            }
        }

        log.info("Configured JDBC URL: {}, Driver: {}, Username: {}", maskUrl(dbUrl), driverClassName, username);

        return DataSourceBuilder.create()
                .url(dbUrl)
                .username(username)
                .password(password)
                .driverClassName(driverClassName)
                .build();
    }

    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
        return hibernateProperties -> {
            String dbUrl = defaultUrl;
            if (!"local".equals(activeProfile)) {
                String envDbUrl = System.getenv("DATABASE_URL");
                if (envDbUrl == null) {
                    envDbUrl = System.getProperty("DATABASE_URL");
                }
                if (envDbUrl != null && !envDbUrl.trim().isEmpty()) {
                    dbUrl = envDbUrl;
                }
            }

            if (dbUrl != null) {
                if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://") || dbUrl.contains("postgresql")) {
                    hibernateProperties.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
                    log.info("Dynamically configured Hibernate dialect to: PostgreSQLDialect");
                } else if (dbUrl.startsWith("mysql://") || dbUrl.contains("mysql")) {
                    hibernateProperties.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
                    log.info("Dynamically configured Hibernate dialect to: MySQLDialect");
                } else if (dbUrl.contains("h2")) {
                    hibernateProperties.put("hibernate.dialect", "org.hibernate.dialect.H2Dialect");
                    log.info("Dynamically configured Hibernate dialect to: H2Dialect");
                }
            }
        };
    }

    private String maskUrl(String url) {
        if (url == null) {
            return null;
        }
        return url.replaceAll(":[^:@]+@", ":******@").replaceAll("password=[^&]+", "password=******");
    }
}
