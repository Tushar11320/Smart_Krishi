# Smart Krishi Marketplace 🌾

Welcome to the **Smart Krishi Marketplace**, an enterprise-grade web and progressive web application (PWA) designed to empower farmers and local sellers with localized weather intelligence, order checkouts, inventory tracking, and payment gateways.

---

## 📁 Repository Directory Layout

The repository is organized in a modular monorepo structure:

```text
Smart-Krishi/
├── frontend/                     # React + Vite Client Application (PWA)
│   ├── src/                      # Source React components and hooks
│   ├── public/                   # Static icons and service worker assets
│   ├── vite.config.js            # Build chunking and plugin settings
│   └── vercel.json               # Vercel SPA redirect settings
├── backend/                      # Spring Boot 3 + Java 21 REST API Engine
│   ├── src/main/java/            # Java backend components and security
│   ├── src/main/resources/       # Environment configs and Flyway schema
│   ├── Dockerfile                # Production multi-stage Docker build
│   └── pom.xml                   # Maven dependencies (dependencies locked)
├── database/                     
│   └── schema/                   # Consolidated SQL schema and optimization logs
├── docs/                         # Audit reports and manuals
│   ├── architecture/             # Design specs and scale guides
│   ├── audit-reports/            # Security release and code validation reports
│   └── deployment-guides/        # Environment configurations and guides
└── testing/                      
    └── reports/                  # Execution trace and runner logs
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Java**: JDK 21
- **Database**: MySQL 8.x
- **Node.js**: v18.x or higher

### 2. Run the Backend API
Navigate to the backend directory, configure your database credentials, and start the Spring Boot runtime:
```bash
cd backend
# Build the application
./mvnw.cmd clean install -DskipTests
# Boot the Spring Boot application
./mvnw.cmd spring-boot:run
```
The REST API will bind to `http://localhost:8080`.

### 3. Run the Frontend PWA Client
Navigate to the frontend directory, install local packages, and boot Vite's dev server:
```bash
cd frontend
# Install packages
npm install
# Start dev server
npm run dev
```
The web client will spin up at `http://localhost:5173`.

---

## 🔒 Security & Deployment

- All production environment configurations and variable validations are described inside the [Deployment Env Guide](file:///docs/deployment-guides/DEPLOYMENT_ENV_GUIDE.md).
- To containerize or deploy the server via Render, refer to the [Docker Deployment Guide](file:///docs/deployment-guides/DOCKER_DEPLOYMENT.md).
- PWA manifests and app caching mechanisms are detailed in the PWA documentation.
