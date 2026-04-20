# WettenHalls Management System 🚀

A comprehensive Management System built with a modern Full-Stack TypeScript architecture, featuring automated deployments and robust maintenance tools.

## 🏗 System Architecture

The project is structured as a monorepo-style workspace with separate Backend and Frontend services, orchestrated by **Docker**.

### 🎨 Frontend

- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite (Ultra-fast development & bundling).
- **Testing**: **Vitest** for unit and integration testing.
- **Styling**: Vanilla CSS (Premium & Custom UI).
- **Key Features**: Authentication, Navigation Builder, Dynamic Sorting (Drag-and-Drop).

### ⚙️ Backend

- **Framework**: Node.js + Express + TypeScript.
- **API Documentation**: **OpenAPI (Swagger/Scalar)** integrated. Documentation is available at `/api-docs` (Dev only).
- **Security**: Express Session with MongoStore, CORS, and role-based authorization.
- **Database**: MongoDB (Atlas) with **Mongoose**.
- **Migrations**: **migrate-mongo** for version-controlled database schema and data updates.

### 🐳 Infrastructure & Containerization

- **Docker**: Customized Dockerfiles for both services (Multi-stage builds for production).
- **Docker Compose**: Orchestrates `backend`, `frontend`, and networking.
- **Nginx**: Operates as a Reverse Proxy (configured on the VM) to handle HTTPS (SSL) and route traffic to internal Docker services.

## 🚀 CI/CD & Deployment Strategy

### GitHub Actions

- **Continuous Integration (CI)**: (Optional/Customizable) scripts to verify builds.
- **Continuous Deployment (CD)**:
  1. Builds Production Docker Images.
  2. Pushes Images to **GitHub Container Registry (GHCR)**.
  3. SSHs into **Azure VM**.
  4. Pulls latest images and executes **Database Migrations** (`npm run migrate:up`).
  5. Restarts containers with zero-downtime strategy.

### Networking on Azure VM

- Secure Private Network within Docker.
- Port mapping via Nginx (80/443 -> Internal Docker Ports).
- Automated SSL management for secure service access.

## 🛠 Developer Workflow

### Installation

```bash
# Install root dependencies
npm install

# Install service dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Local Development

```bash
# Run everything concurrently (Super, Admin, Server)
npm run dev
```

### Database Migrations

```bash
cd backend
npm run migrate:create <name>  # Create new migration
npm run migrate:up             # Apply migrations
npm run migrate:status         # Check status
```

### API Documentation

Once the backend is running:

- Access: `http://localhost:5000/api-docs`

---

_Maintained by [nghoangquan175](https://github.com/nghoangquan175)_
