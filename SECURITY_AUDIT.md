# TheParchoons - Security Audit Report

**Date:** August 20, 2026
**Scope:** Complete Backend API & Frontend Security Audit

## 1. Authentication & Authorization
✅ **JWT Secret Hardening:** Removed the hardcoded fallback secret in `config.js`. The server will now explicitly crash on startup in production if `JWT_SECRET` is missing, preventing use of insecure defaults.
✅ **Admin Password Hardening:** Removed the hardcoded 'admin123' fallback. Default admin creation now requires explicit environment variables.
✅ **Finalize Endpoint Auth:** The `/api/orders/:orderId/finalize` endpoint now requires the customer's `phone` in the request body to verify that the request is genuinely from the customer who placed the order.

## 2. API Abuse & Rate Limiting
✅ **Rate Limiting Implemented:** Added `express-rate-limit` with three tiers:
   - General Public Routes: 100 requests / minute
   - Sensitive Routes (Login, Order Creation): 10 requests / minute
   - Upload Routes: 20 requests / minute
✅ **Idempotency Implemented:** Added `idempotencyKey` support to `POST /api/orders`. If the frontend accidentally sends multiple identical requests due to a double-click or network retry within 60 seconds, the backend will return the original order safely without duplicating it.
✅ **Order ID Race Condition Fixed:** Order IDs are now generated using a secure cryptographically random hex suffix instead of a database-dependent sequential count, completely eliminating collisions under high concurrency.

## 3. Data Integrity & Input Validation
✅ **Price Protection Verified:** The backend correctly ignores any prices sent by the frontend and exclusively calculates subtotals based on `Product.findById` database queries.
✅ **Quantity Validation:** Added `express-validator` to ensure that item quantities are strict integers between `1` and `99`. This prevents negative quantity exploits that could theoretically reduce the total cart value.
✅ **XSS Sanitization:** Implemented a lightweight recursive HTML tag stripper for all `req.body` inputs on admin routes to prevent Cross-Site Scripting payloads from being stored in banners or product descriptions.
✅ **Strict Body Limits:** Reduced the `express.json` limit from 10MB to `1mb` to prevent memory exhaustion attacks.

## 4. Operational Security
✅ **CORS Locked Down:** The `cors()` middleware was changed from open `*` to strictly allow only origins defined in the `ALLOWED_ORIGINS` environment variable (e.g., `https://theparchoons.store`).
✅ **Helmet Configured:** Re-enabled Content Security Policy in production.
✅ **Error Handling:** Global error handler now strips stack traces in production, preventing internal structural leakage.
✅ **Audit Logging:** Created an `AuditLog` database model to permanently track all `CREATE`, `UPDATE`, `DELETE`, and `SETTINGS_UPDATE` actions performed by admins.

---
*Status: PASSED. Production Hardening Complete.*
