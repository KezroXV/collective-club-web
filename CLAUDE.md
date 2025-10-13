# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Start Next.js dev server with Turbopack
npm run build            # Build production bundle
npm start                # Start production server
npm run lint             # Run ESLint
```

### Database
```bash
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Push schema changes to database
npx prisma studio        # Open Prisma Studio GUI
npm run seed             # Seed database with initial data
npm run db:seed          # Alternative seed command (uses prisma db seed)
```

### Admin Management
```bash
npm run admin                           # Show available admin commands
npm run admin -- analyze                # Analyze admin status across all shops
npm run admin -- create-admin <shopId> [email] [name]  # Create emergency admin for a shop
npm run admin -- promote <userId> [requesterId]        # Promote existing user to admin
npm run admin -- auto-repair            # Auto-repair orphaned shops
npm run admin -- audit                  # Generate complete audit report
```

### Data Recovery
```bash
npm run recovery                        # Show available recovery commands
npm run recovery -- backup <shopId>     # Backup complete shop data
npm run recovery -- restore <backupPath> [newShopId]  # Restore from backup
npm run recovery -- clean               # Clean orphaned data
npm run recovery -- migrate <sourceShopId> <targetShopId> [posts,categories,users]
```

## Architecture

### Multi-Tenant System
This is a **multi-tenant Shopify forum application** where each Shopify shop has completely isolated data. The core architecture is built around strict **shop isolation**.

**Shop Isolation** (`lib/shopIsolation.ts`):
- Every request must be associated with a `shopId`
- `shopId` is extracted from query params (`?shop=`), headers, or cookies
- In production, missing `shopId` blocks the request
- In development, defaults to "collective-club.myshopify.com"
- All database queries MUST filter by `shopId`

**Key Functions**:
- `getShopContext(request)` - Returns `{ shopId, shopDomain, shopName }`
- `getShopId(request)` - Returns just `shopId` (throws on error)
- `ensureShopIsolation(shopId)` - Validates `shopId` format
- `validateUserBelongsToShop(userId, shopId)` - Verifies user ownership
- `validateResourceBelongsToShop(type, resourceId, shopId)` - Verifies resource ownership

### Authentication
**Google OAuth (NextAuth)**:
- Uses NextAuth with Google OAuth provider
- JWT-based sessions (not database sessions for multi-tenant compatibility)
- On first sign-in to a shop, creates `User` and `Account` records with `shopId`
- First user in a shop becomes `ADMIN` with `isShopOwner: true`
- Subsequent users become `MEMBER`

**Shopify Embedded App Authentication**:
- Uses `@shopify/app-bridge-react` for embedded Shopify apps
- Automatic authentication via `/api/auth/shopify` endpoint
- Creates shop and user automatically on first access
- First user becomes shop owner with `ADMIN` role
- Uses generic email format: `shopify-user@{shop-domain}`
- Sets persistent cookies for iframe authentication

**Default Setup**:
- Default roles (`ADMIN`, `MODERATOR`, `MEMBER`) are created automatically per shop
- Default categories and badges are created on shop initialization

**Session Data** includes:
- `user.id`, `user.email`, `user.name`, `user.image`
- `user.role` - Base role (ADMIN/MODERATOR/MEMBER)
- `user.shopId` - Shop isolation key
- `user.isShopOwner` - True for shop owner
- `user.roleInfo` - Custom role information if assigned

### Permissions System (`lib/permissions.ts`)
- Three base roles: `ADMIN`, `MODERATOR`, `MEMBER`
- Each role has predefined permissions (e.g., `Permission.MANAGE_POSTS`, `Permission.DELETE_COMMENTS`)
- Custom roles can be created per shop with specific permissions
- Use `hasPermission(userRole, permission)` to check access
- Use `canChangeRole(context)` for role change validation

**Key Rules**:
- Only `ADMIN` can change roles
- Users cannot change their own role
- Shop owner cannot be modified
- Admins cannot modify other admins

### Database Schema (Prisma)
All models have `shopId` field for multi-tenant isolation:
- **Shop**: `shopDomain` (unique), `shopName`, `ownerId`, `settings` (JSON)
- **User**: `email` (unique per shop), `role`, `shopId`, `isShopOwner`, `isBanned`
- **Post**: `title`, `content`, `slug` (SEO), `isPinned`, `categoryId`, `authorId`, `shopId`
- **Category**: `name` (unique per shop), `color`, `description`, `order`, `shopId`
- **Badge**: `name`, `imageUrl`, `requiredPoints`, `shopId`
- **Role**: Custom roles per shop with `name`, `displayName`, `color`, `permissions` (JSON), `shopId`
- **Poll/PollOption/PollVote**: Polls attached to posts
- **Comment**: Supports nested replies via `parentId`
- **Reaction**: Emoji reactions on posts/comments (LIKE, LOVE, LAUGH, WOW, APPLAUSE)
- **Follow**: User follow system per shop
- **UserPoints/PointTransaction**: Gamification system (points for creating posts, comments, etc.)

**Important Constraints**:
- `@@unique([shopId, email])` on User
- `@@unique([shopId, name])` on Category, Badge, Role
- `@@unique([shopId, slug])` on Post

### API Route Pattern
All API routes must:
1. Extract `shopId` from request using `getShopContext()`
2. Verify user authentication (NextAuth session)
3. Check permissions if needed
4. Filter all database queries by `shopId`

Example:
```typescript
const { shopId } = await getShopContext(request);
const posts = await prisma.post.findMany({
  where: { shopId }, // ALWAYS filter by shopId
});
```

### Project Structure
- `app/` - Next.js 15 App Router pages and API routes
- `components/` - Reusable React components (UI, forms, etc.)
- `lib/` - Core utilities (auth, permissions, shop isolation, points system)
- `prisma/` - Database schema and migrations
- `scripts/` - Admin and recovery CLI scripts

### Security Guarantees
- **Strict shop isolation**: Users can only access data from their shop
- **Domain validation**: Shop domains are validated against Shopify format (`*.myshopify.com`)
- **No cross-tenant access**: All queries enforce `shopId` filtering
- **Role-based permissions**: Actions are gated by user role and permissions
- **Injection prevention**: Domain patterns block `<>`, `javascript:`, `data:`, etc.

### Performance
- Optimized for <2s response time with 1000+ posts per shop
- Database indexes on `shopId` for all multi-tenant queries
- Tested with 10 concurrent shops

## Important Notes
- **NEVER** query database without filtering by `shopId`
- **ALWAYS** use `getShopContext()` or `getShopId()` at the start of API routes
- When creating resources, include `shopId` in the data
- Use utility scripts for admin management instead of manual database edits
- Default roles are created automatically on shop creation
- Shop owner (`isShopOwner: true`) has special protection from role changes
