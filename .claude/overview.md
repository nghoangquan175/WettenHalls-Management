# Project Overview

## Project Summary
Project name: WettenHalls Management

This is a fullstack web application for role-based system management.
- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Node.js + Express + TypeScript
- Database: MongoDB
- Auth: Session-based (cookie)

## Architecture
- frontend/: UI application
- backend/: REST API server

## High-Level Structure

### Frontend
- src/pages: Route-based pages (Login, Dashboard...)
- src/components: Reusable UI components
- src/layouts: Shared layouts (MainLayout, AuthLayout)
- src/contexts: Global State Management (AuthContext)
- src/guards: Route protection logic (AuthGuard)
- src/services: API client calls (Axios instances)
- src/constants: System constants & navigation config
- src/routes: Navigation definitions

### Backend
- src/routes: API route definitions
- src/controllers: Request handlers & logic
- src/models: Mongoose schemas
- src/middleware: Auth, error handling, and validation
- src/config: Database & system configuration
- src/types: TypeScript definitions
