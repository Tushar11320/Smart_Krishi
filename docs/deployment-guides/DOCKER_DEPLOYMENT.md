# Docker Containerization & Render Deployment Guide

This guide details instructions for building, running, and deploying the **Smart Krishi Backend** using the production Docker configuration.

---

## 1. Local Container Build & Verification
Ensure you have **Docker Desktop** running on your local machine.

### Step A: Build the Container Image
From the repository root directory, run the build command targeting the backend subdirectory:
```bash
docker build -t smartkrishi-backend ./backend
```

### Step B: Run the Container Locally
Start the container and map the external port `8080` to the container port `8080`:
```bash
docker run -p 8080:8080 \
  --name smartkrishi-backend-run \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e JWT_SECRET=your_jwt_secret_key_at_least_256_bit \
  smartkrishi-backend
```

---

## 2. Render Deployment Instructions (Docker Web Service)

Render allows you to build and host applications directly from their source Docker configuration.

### Step A: Push Source to GitHub
Make sure the new `Dockerfile` and `.dockerignore` files are committed and pushed to your git repository:
```bash
git add backend/Dockerfile backend/.dockerignore
git commit -m "chore: add production multi-stage Java 21 Docker configuration"
git push origin main
```

### Step B: Create a New Web Service on Render
1. Navigate to the **Render Dashboard** (https://dashboard.render.com).
2. Click **New +** and select **Web Service**.
3. Link your connected GitHub repository.
4. Set the following parameters:
   - **Name**: `smart-krishi-backend`
   - **Region**: Select the region closest to your users.
   - **Branch**: `main`
   - **Root Directory**: `backend` *(Critical: This points Render to the backend folder containing the Dockerfile)*
   - **Runtime**: **Docker** *(Critical: Render will automatically detect the Dockerfile inside the Root Directory)*
   - **Instance Type**: Select your pricing plan (Free or Starter).
5. Open the **Advanced** section to add the required production Environment Variables. Refer to the list inside [DEPLOYMENT_ENV_GUIDE.md](file:///PROJECT_ROOT/DEPLOYMENT_ENV_GUIDE.md) (such as `SPRING_PROFILES_ACTIVE=prod`, `DATABASE_URL`, `JWT_SECRET`, etc.).
6. Click **Create Web Service**.

Render will automatically parse the multi-stage Docker file, run the Maven compiler using JDK 21, package the application jar, extract it inside the JRE 21 runtime container, and boot the application port `8080`.

---

## 3. Container Optimization & Tuning Configurations

- **Non-Root Execution**: The runtime container isolates the process under a non-privileged `spring` system user. It has no root permissions, reducing the security attack surface in production.
- **Memory Tuning (`-XX:MaxRAMPercentage=75.0`)**: Instead of setting hardcoded heap limit allocations (e.g. `-Xmx512m`), the JVM is tuned to use up to `75%` of the Docker container's allocated memory limits. This prevents OOM (Out Of Memory) container terminations and adapts dynamically if you scale the Render plan size.
- **Garbage Collection (`-XX:+UseG1GC`)**: Enables the G1 Garbage Collector, optimizing heap processing and lowering server response latency under load.
- **Flyway Database Auto-migration**: When the container boots, Flyway will parse and apply tables defined inside `V1__init_schema.sql` automatically.
