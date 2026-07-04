# ==========================================
# STAGE 1: BUILD STAGE
# ==========================================
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

# Copy Maven Wrapper configuration and files
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Convert line endings of wrapper to Unix format and make executable
RUN tr -d '\r' < mvnw > mvnw_unix && mv mvnw_unix mvnw && chmod +x mvnw

# Download dependencies to cache them inside the Docker layer
RUN ./mvnw dependency:go-offline -B

# Copy application source files
COPY src ./src

# Build production JAR skipping unit tests (tests can be run in CI/CD pipeline)
RUN ./mvnw clean package -DskipTests -B

# ==========================================
# STAGE 2: RUNTIME STAGE
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Create a non-privileged system group and user to isolate container execution
RUN addgroup --system spring && adduser --system spring --ingroup spring

# Copy compiled JAR from builder stage
COPY --from=builder /app/target/smart-krishi-backend-1.0.0.jar app.jar

# Define uploads directory for local fallbacks and set permissions
RUN mkdir -p uploads logs && chown -R spring:spring /app

# Set active runtime user
USER spring:spring

# Expose application port
EXPOSE 8080

# Tune JVM parameters for container execution (MaxRAMPercentage respects memory limit allocations)
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
