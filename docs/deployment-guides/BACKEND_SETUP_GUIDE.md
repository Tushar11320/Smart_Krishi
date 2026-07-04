# SmartKrishi Backend Setup Guide

## Prerequisites

1. **Java 21** - Download from [Oracle](https://www.oracle.com/java/technologies/downloads/#java21) or [OpenJDK](https://adoptium.net/)
2. **Maven 3.8+** - Download from [Maven](https://maven.apache.org/download.cgi)
3. **MySQL 8.0+** - Download from [MySQL](https://dev.mysql.com/downloads/mysql/)
4. **IDE** - IntelliJ IDEA, Eclipse, or VS Code with Java extensions

## Installation Steps

### 1. Install Java 21

```bash
# Verify Java installation
java -version
# Should show: java version "21.x.x"
```

### 2. Install Maven

```bash
# Verify Maven installation
mvn -version
# Should show: Apache Maven 3.x.x
```

### 3. Setup MySQL Database

```sql
-- Create database
CREATE DATABASE smartkrishi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional)
CREATE USER 'smartkrishi_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smartkrishi_db.* TO 'smartkrishi_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configure Application Properties

Update `backend/src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: smart-krishi-backend
  
  datasource:
    url: jdbc:mysql://localhost:3306/smartkrishi_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: smartkrishi_user
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        format_sql: true
  
  flyway:
    enabled: false
    baseline-on-migrate: true
    locations: classpath:db/migration
  
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

server:
  port: 8080
  servlet:
    context-path: /api

jwt:
  secret: your-jwt-secret-key-min-256-bits-long-secure-key-here
  expiration: 86400000  # 24 hours in milliseconds
  refresh-expiration: 604800000  # 7 days

cloudinary:
  cloud-name: your-cloud-name
  api-key: your-api-key
  api-secret: your-api-secret

razorpay:
  key-id: your-razorpay-key-id
  key-secret: your-razorpay-key-secret

cors:
  allowed-origins: http://localhost:5173,http://localhost:3000
  allowed-methods: GET,POST,PUT,DELETE,OPTIONS,PATCH
  allowed-headers: "*"
  allow-credentials: true

logging:
  level:
    com.smartkrishi: DEBUG
    org.springframework.web: DEBUG
    org.hibernate: INFO
```

### 5. Build the Project

```bash
cd backend

# Clean and compile
mvn clean compile

# Run tests (optional)
mvn test

# Package the application
mvn clean package -DskipTests
```

### 6. Run the Application

#### Option 1: Using Maven
```bash
mvn spring-boot:run
```

#### Option 2: Using JAR
```bash
java -jar target/smart-krishi-backend-1.0.0.jar
```

#### Option 3: Using IDE
- Open project in IntelliJ IDEA or Eclipse
- Run `SmartKrishiApplication.java` main class

### 7. Verify Installation

The application should start on `http://localhost:8080`

Check these endpoints:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/v3/api-docs
- **Health Check**: http://localhost:8080/actuator/health

## External Services Setup

### 1. Cloudinary (Image Storage)

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your credentials from Dashboard
3. Update `application.yml` with:
   - cloud-name
   - api-key
   - api-secret

### 2. Razorpay (Payment Gateway)

1. Sign up at [Razorpay](https://razorpay.com/)
2. Get API keys from Dashboard
3. Update `application.yml` with:
   - key-id
   - key-secret

### 3. Email Service (Gmail)

1. Enable 2-Factor Authentication on Gmail
2. Generate App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Update `application.yml` with:
   - username: your Gmail address
   - password: generated app password

## Testing the API

### Using Swagger UI

1. Open http://localhost:8080/swagger-ui.html
2. Click on any endpoint
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"

### Using cURL

#### Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890",
    "role": "BUYER"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Get Products (with token)
```bash
curl -X GET http://localhost:8080/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Import the API collection (if available)
2. Set base URL: `http://localhost:8080`
3. Configure Authorization: Bearer Token
4. Start testing endpoints

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Change port in application.yml
server:
  port: 8081
```

#### 2. Database Connection Failed
- Verify MySQL is running
- Check database credentials
- Ensure database exists
- Check firewall settings

#### 3. Compilation Errors
```bash
# Clean Maven cache
mvn clean

# Reimport dependencies
mvn dependency:resolve

# Update project in IDE
```

#### 4. Lombok Not Working
- Install Lombok plugin in IDE
- Enable annotation processing
- Restart IDE

#### 5. JWT Token Invalid
- Check JWT secret key length (min 256 bits)
- Verify token expiration time
- Check system time synchronization

## Development Tips

### Hot Reload
Add Spring Boot DevTools for automatic restart:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

### Database GUI Tools
- **MySQL Workbench** - Visual database design
- **DBeaver** - Universal database tool
- **phpMyAdmin** - Web-based MySQL admin

### API Testing Tools
- **Postman** - API testing & documentation
- **Insomnia** - REST client
- **Thunder Client** - VS Code extension

### Debugging
```yaml
# Enable debug logging
logging:
  level:
    root: INFO
    com.smartkrishi: DEBUG
    org.springframework: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type: TRACE
```

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/smartkrishi/
│   │   │       ├── config/           # Configuration classes
│   │   │       ├── controller/       # REST controllers
│   │   │       ├── dto/              # Data Transfer Objects
│   │   │       ├── entity/           # JPA entities
│   │   │       ├── exception/        # Exception handlers
│   │   │       ├── repository/       # Data repositories
│   │   │       ├── security/         # Security components
│   │   │       ├── service/          # Business logic
│   │   │       └── SmartKrishiApplication.java
│   │   └── resources/
│   │       ├── application.yml       # Configuration file
│   │       └── db/migration/         # Flyway migrations
│   └── test/                         # Test classes
└── pom.xml                           # Maven configuration
```

## Default Users

After first run, you may need to manually insert admin user:

```sql
-- Insert admin role
INSERT INTO roles (role_name) VALUES ('ADMIN');

-- Insert admin user (password: admin123)
INSERT INTO users (first_name, last_name, email, password, phone, is_verified, created_at, updated_at)
VALUES ('Admin', 'User', 'admin@smartkrishi.com', '$2a$10$encoded-password', '9999999999', true, NOW(), NOW());

-- Assign admin role
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
```

## Next Steps

1. Complete partial service implementations
2. Add integration tests
3. Configure CI/CD pipeline
4. Set up production database
5. Configure SSL/TLS
6. Add rate limiting
7. Implement caching
8. Add monitoring & logging

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review Swagger documentation
- Check `BACKEND_COMPLETION_STATUS.md` for implementation status

---

**Happy Coding! 🚀**
