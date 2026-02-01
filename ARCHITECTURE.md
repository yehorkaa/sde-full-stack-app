# Architecture

## Overview

This is an Nx monorepo containing a full-stack message application with a Next.js frontend and NestJS backend.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │  App Router │→ │ TanStack     │→ │ Axios + Interceptors  │   │
│  │  Pages      │  │ Query        │  │ (Token Refresh)       │   │
│  └─────────────┘  └──────────────┘  └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ REST API (HTTP + Cookies)
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (NestJS)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │ Controllers │→ │ Services     │→ │ Mongoose Models       │   │
│  └─────────────┘  └──────────────┘  └───────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Guards: AuthenticationGuard → AccessTokenGuard          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MongoDB                                  │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │ users           │  │ messages                             │   │
│  │ - email         │  │ - authorId (ref: users)             │   │
│  │ - passwordHash  │  │ - content                           │   │
│  │ - name          │  │ - tag                               │   │
│  └─────────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Apps

### sde-front-end (Next.js)
- **Framework**: Next.js 14 with App Router
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS with shadcn/ui components
- **Virtualization**: react-cool-virtual for efficient list rendering
- **API Layer**: Axios with response interceptors for automatic token refresh

### sde-back-end (NestJS)
- **Framework**: NestJS with modular architecture
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with access/refresh token pattern
- **Validation**: class-validator with global ValidationPipe
- **Security**: bcrypt for password hashing, httpOnly cookies for access tokens

## Libs

### shared-types
- TypeScript interfaces and enums shared between frontend and backend
- Includes: User, Message, DTOs, MessageTag enum, API response types
- Path alias: `@sde-challenge/shared-types`

## Data Flow

### Authentication Flow

```
1. User submits credentials
   │
   ▼
2. Backend validates, hashes password (sign-up) or compares (sign-in)
   │
   ▼
3. Generate token pair:
   - Access Token (1 hour): Contains userId, email
   - Refresh Token (24 hours): Contains userId, refreshTokenId
   │
   ▼
4. Store refreshTokenId in memory (Map)
   │
   ▼
5. Response:
   - Set accessToken as httpOnly cookie
   - Return refreshToken in response body
   │
   ▼
6. Frontend stores refreshToken in localStorage
   │
   ▼
7. Subsequent requests include accessToken cookie automatically
   │
   ▼
8. On 401: Axios interceptor calls /refresh-token, retries request
```

### Message CRUD Flow

```
GET /messages?tag=X&cursor=Y
   │
   ▼
Build MongoDB query with filters
   │
   ▼
Apply cursor pagination: { _id: { $lt: cursor } }
   │
   ▼
Sort by _id DESC, limit + 1
   │
   ▼
Return { messages, nextCursor, hasMore }
```

## Security Considerations

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Tokens**: Signed with secret, includes audience/issuer validation
3. **Cookie Security**: httpOnly, sameSite='lax', secure in production
4. **Ownership Checks**: Backend validates user owns resource before edit/delete
5. **Input Validation**: All DTOs validated with class-validator
6. **CORS**: Configured to allow frontend origin with credentials

## Database Design

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  passwordHash: String,
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  authorId: ObjectId (ref: users, indexed),
  content: String (max: 240),
  tag: String (enum, indexed),
  createdAt: Date (indexed),
  updatedAt: Date
}

// Compound indexes for efficient filtering with pagination
{ tag: 1, _id: -1 }
{ authorId: 1, _id: -1 }
```

## Next Steps

### Short-term Improvements
1. **Redis for Refresh Tokens**: Replace in-memory Map with Redis for persistence and scalability
2. **Rate Limiting**: Add rate limiting for auth endpoints and message creation
3. **Input Sanitization**: Add XSS protection for message content
4. **Error Boundary**: Add React error boundaries for better error handling

### Medium-term Features
1. **Real-time Updates**: WebSocket integration for live message updates
2. **Full-text Search**: MongoDB text indexes or Elasticsearch for message search
3. **File Uploads**: Support image attachments in messages
4. **User Profiles**: Extended profile pages with avatar upload

### Long-term Scalability
1. **Microservices**: Split auth and messages into separate services
2. **Message Queue**: Add event-driven architecture with Kafka/RabbitMQ
3. **CDN**: Cache static assets and consider edge caching for message feeds
4. **Read Replicas**: MongoDB replica set for read scaling

## Scaling for Thousands of Reads/Second

### Caching Strategy
- **CDN/Edge**: Cache static assets at edge; consider Vercel Edge Functions for SSR
- **Application Cache**: Redis for frequently accessed data (popular tags, user sessions)
- **Query Cache**: TanStack Query's built-in caching with appropriate staleTime

### Database Optimization
- **Indexes**: Compound indexes on (tag, _id), (authorId, _id), (createdAt)
- **Read Replicas**: MongoDB replica set with `readPreference: 'secondaryPreferred'`
- **Sharding**: Consider sharding by authorId or date range for large collections
- **Connection Pooling**: Configure appropriate pool size for concurrent connections

### Pagination
- Cursor-based prevents duplicates under high write load
- Bounded page size (max 50) limits response time and payload size
- Cursor encoded in _id leverages existing index

### Fault Tolerance
- **MongoDB Replica Set**: 3+ nodes for automatic failover
- **Retry Logic**: Axios retry interceptor for transient failures
- **Circuit Breaker**: Implement circuit breaker for downstream services
- **Graceful Degradation**: Show cached data if database unavailable
- **Health Checks**: `/health` endpoint for load balancer and monitoring

### Monitoring
- **Metrics**: Prometheus + Grafana for request latency, error rates, DB query times
- **Logging**: Structured JSON logs with Winston/Pino, aggregated with ELK or Loki
- **Tracing**: OpenTelemetry for distributed request tracing
- **Alerting**: PagerDuty/OpsGenie for error rate spikes, high latency, availability
