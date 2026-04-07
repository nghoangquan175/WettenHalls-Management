# API Patterns

- Use RESTful principles.
- Global error handling using `errorHandler` middleware.
- Session-based authentication.
- Request validation using express-validator.
- All protected routes must use auth middleware.
- Role-sensitive endpoints must use RBAC middleware.
- Super admin endpoints must explicitly restrict access to super_admin role only.
- Never rely on frontend-only permission checks.