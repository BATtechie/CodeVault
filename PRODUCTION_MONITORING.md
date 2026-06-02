# Production Logging, Monitoring & Health Check Guide

This guide covers production logging, error handling, monitoring recommendations, and health check implementation for CodeVault.

## Table of Contents

1. [Backend Logging](#backend-logging)
2. [Health Checks](#health-checks)
3. [Error Handling](#error-handling)
4. [Monitoring & Alerting](#monitoring--alerting)
5. [Performance Tracking](#performance-tracking)
6. [Security Logging](#security-logging)

## Backend Logging

### Structured Logging

The backend logs structured data to aid debugging:

```javascript
// Example logs with context
console.error('Signup error:', {
  email: req.body.email,
  timestamp: new Date().toISOString(),
  error: error.message,
  stack: error.stack,
});
```

### Log Levels

- **ERROR**: Critical failures, exceptions
- **WARN**: Deprecated endpoints, unusual conditions
- **INFO**: Deployment events, health checks
- **DEBUG**: Request/response details (dev only)

### Log Output

- **Local Development**: Console output
- **Production**: Deployment platform logs (Render/Railway)
  - Render: Dashboard → Logs
  - Railway: Dashboard → Logs

## Health Checks

### Endpoint: GET /health

**Purpose**: Verify backend and database are operational

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-06-02T14:30:00Z",
    "database": "healthy"
  }
}
```

**Usage**:
```bash
curl https://codevault-api.onrender.com/health
```

### Liveness Check

**What it checks**:
- Express server is running
- Response handler works

**Frequency**: Every 30 seconds

### Readiness Check

**What it checks**:
- Database connection is active
- Schema is valid

**Frequency**: Every 60 seconds

### Implementation

```javascript
// In src/index.js
app.get('/health', async (_req, res) => {
  const database = await getDatabaseHealth();

  return sendSuccess(res, {
    data: {
      status: database === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database,
    },
  });
});

const getDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'unhealthy';
  }
};
```

## Error Handling

### Global Error Handler

The backend includes a global error handler that:

1. Catches unhandled exceptions
2. Formats errors consistently
3. Logs to console
4. Returns appropriate HTTP status

```javascript
app.use((error, _req, res, _next) => {
  console.error(error);

  return sendError(res, {
    status: error.statusCode || error.status || 500,
    message:
      error.message ||
      'An unexpected server error occurred.',
    details: isProduction ? undefined : { stack: error.stack },
  });
});
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "details": { "stack": "..." }  // Only in development
}
```

### Common Errors

| Error | HTTP Status | Cause |
|-------|-------------|-------|
| Invalid email | 400 | Bad request validation |
| Email exists | 409 | User already registered |
| Invalid password | 401 | Auth failed |
| Not found | 404 | Resource doesn't exist |
| Unauthorized | 401 | Missing/invalid token |
| Forbidden | 403 | CSRF token mismatch |
| Rate limited | 429 | Too many requests |
| Server error | 500 | Unexpected exception |

## Monitoring & Alerting

### Recommended Services

#### 1. Sentry (Error Tracking)

**Setup**:
```bash
npm install @sentry/node @sentry/integrations
```

**Implementation**:
```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.errorHandler());
```

**Features**:
- Automatic error capture
- Stack trace grouping
- Release tracking
- Alert on error spikes

#### 2. LogRocket (Session Replay)

**For Frontend Monitoring**

```javascript
import LogRocket from 'logrocket';

LogRocket.init('your-app-id');

// Log React errors
ReactDOM.render(<App />, document.getElementById('root'));
```

#### 3. Datadog (Infrastructure)

**Monitors**:
- Request latency
- Database query performance
- Memory usage
- CPU utilization

#### 4. PagerDuty (Incident Response)

**Integrations**:
- Sentry → PagerDuty alerts
- Render/Railway → incident escalation
- Custom webhooks for health checks

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| 5xx Errors | > 10/min | Alert team |
| Database latency | > 5s | Warning |
| Auth failures | > 50/min | Investigate |
| Rate limit hits | > 100/min | Scale up |
| Memory usage | > 80% | Monitor/scale |
| API availability | < 99% | Critical alert |

## Performance Tracking

### Metrics to Monitor

#### Backend Metrics

```javascript
// Request timing
const startTime = Date.now();
// ... handle request
const duration = Date.now() - startTime;
console.log(`${req.method} ${req.path} completed in ${duration}ms`);
```

#### Key Indicators

| Metric | Target | Alert |
|--------|--------|-------|
| P99 Latency | < 100ms | > 500ms |
| Error Rate | < 0.1% | > 1% |
| Availability | 99.9% | < 99% |
| DB Query Time | < 50ms | > 200ms |

### Query Optimization

```javascript
// Use Prisma query optimization
const result = await prisma.snippet.findMany({
  where: { visibility: 'PUBLIC' },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { updatedAt: 'desc' },
  select: {
    id: true,
    title: true,
    language: true,
    // Don't select large fields unnecessarily
  },
});
```

## Security Logging

### Authentication Events

```javascript
// Log successful logins
console.info(`User login successful: ${user.id} from ${req.ip}`);

// Log failed attempts
console.warn(`Failed login attempt: ${email} from ${req.ip}`);
```

### Authorization Checks

```javascript
// Log permission denials
if (snippet.userId !== req.user.id) {
  console.warn(`Unauthorized access attempt by ${req.user.id} to snippet ${snippetId}`);
}
```

### Sensitive Operations

```javascript
// Log password changes
console.info(`Password changed for user ${userId}`);

// Log 2FA changes
console.info(`2FA enabled for user ${userId}`);

// Log team changes
console.info(`User ${userId} joined team ${teamId}`);
```

### Audit Trail

Recommended fields for audit logging:

```javascript
// Consider adding audit log model to Prisma schema
model AuditLog {
  id        String   @id @default(uuid())
  userId    String   @db.Uuid
  action    String   // signup, login, create_snippet, etc
  resource  String   // snippet, team, user, etc
  details   Json?
  ip        String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}
```

## Deployment-Specific Logging

### Render

**Access logs**:
1. Dashboard → Service → Logs
2. Real-time streaming
3. Historical search available

**Setup**:
```javascript
// Render provides NODE_ENV automatically
console.log(`Environment: ${process.env.NODE_ENV}`);
```

### Railway

**Access logs**:
1. Dashboard → Service → Logs
2. Filter by level
3. Search functionality

**Setup**:
```javascript
// Railway provides PORT automatically
const port = process.env.PORT || 3000;
app.listen(port);
```

## Recommended Monitoring Stack

### Development

- Console logs
- Local database query logs

### Production

```
┌─────────────────┐
│  Express App    │
│  (Error logs)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌─────────┐
│ Sentry │ │ Datadog │
└────────┘ └─────────┘
    │          │
    └────┬─────┘
         ▼
    ┌─────────────┐
    │ PagerDuty   │
    │ (Alerts)    │
    └─────────────┘
```

## Best Practices

### DO

- ✅ Log security events (auth, authorization)
- ✅ Use structured logging format
- ✅ Include timestamps and request IDs
- ✅ Monitor error rates and latency
- ✅ Set up alerts for anomalies
- ✅ Regularly review logs

### DON'T

- ❌ Log passwords or secrets
- ❌ Log sensitive user data
- ❌ Create excessive log volume
- ❌ Leave debug logging in production
- ❌ Ignore alerts
- ❌ Store logs unencrypted

## Testing Monitoring

### Simulate Errors

```bash
# Test error handling
curl https://api.example.com/api/snippets/invalid-id

# Check Sentry for new error
# Verify alert triggered
```

### Load Testing

```bash
# Use tools like k6 or Artillery
npm install -g artillery

# Create load test
artillery quick --count 100 --num 1000 https://api.example.com/health
```

### Health Check Monitoring

```bash
# Continuous health monitoring
while true; do
  curl https://api.example.com/health
  sleep 60
done
```

## Logs Retention

| Environment | Retention | Storage |
|-------------|-----------|---------|
| Development | 24 hours | Local |
| Staging | 7 days | Platform logs |
| Production | 30 days | Platform + Sentry |

## Compliance & Privacy

- Ensure logging complies with GDPR
- Don't log personally identifiable information
- Implement log access controls
- Regular security audits of logging systems

---

**Last Updated**: June 2, 2026  
**Version**: 1.0  
**Status**: Ready for Production
