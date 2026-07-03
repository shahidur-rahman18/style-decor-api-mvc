# Style-Decor API Contract

> Base URL: `VITE_API_URL` (frontend `.env`)  
> Last updated: June 28, 2026 — B8 route hardening

---

## Auth Endpoints (B4–B6) ✅

| Method | Path | Auth | Rate limit | Request Body | Response | Cookie |
|--------|------|------|------------|--------------|----------|--------|
| POST | `/auth/register` | Public | 10 / 15 min | `{ name, email, password }` | `201` `{ user, accessToken }` | set |
| POST | `/auth/login` | Public | 10 / 15 min | `{ email, password }` | `200` `{ user, accessToken }` | set |
| POST | `/auth/firebase-sync` | Bearer Firebase ID | 10 / 15 min | — | `200` `{ user, accessToken }` | set |
| POST | `/auth/refresh` | Cookie only | 60 / 15 min | — | `200` `{ accessToken, user }` | rotated |
| POST | `/auth/logout` | Cookie only | 60 / 15 min | — | `200` `{ message }` | cleared |
| POST | `/auth/logout-all` | Bearer JWT/Firebase | — | — | `200` `{ message }` | cleared |
| GET | `/auth/me` | Bearer JWT/Firebase | — | — | `200` `{ user }` | — |

### Auth user shape

```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "customer",
  "image": "https://..."
}
```

### Refresh cookie

- Name: `refreshToken`
- Flags: `HttpOnly`, `SameSite=Strict`, `Path=/auth/refresh`, `Secure` (production)
- Client must send `withCredentials: true` on refresh/logout requests

### Auth headers

| Endpoint | Header |
|----------|--------|
| `/auth/firebase-sync` | `Authorization: Bearer <firebase-id-token>` |
| All other protected routes | `Authorization: Bearer <access-jwt>` **or** `<firebase-id-token>` (fallback) |

### Validation (register)

- `password`: min 8 chars, 1 uppercase, 1 number

### Error format

```json
{ "success": false, "message": "Invalid email or password" }
```

---

## Existing Endpoints

| Method | Path | Auth | Response | Frontend |
|--------|------|------|----------|----------|
| GET | `/` | Public | `"Hello from Server.."` | — |
| GET | `/services` | Public | `Service[]` | `ServiceList.jsx` |
| GET | `/services/:id` | Public | `Service` | `ServiceDetails.jsx` |
| POST | `/services` | JWT + Seller | Mongo insert result | `AddPlantForm.jsx` |
| PATCH | `/services/:id` | JWT + Seller | Mongo update result | `UpdatePlantForm.jsx` |
| DELETE | `/services/:id` | JWT + Seller | Mongo delete result | `DeleteModal.jsx` |
| GET | `/my-inventory` | JWT + Seller | `Service[]` | `MyInventory.jsx` ⚠️ update URL |
| POST | `/create-checkout-session` | Public | `{ url }` | `PurchaseModal.jsx` |
| POST | `/payment-success` | Public | `{ transactionId, orderId }` | `PaymentSuccess.jsx` |
| GET | `/my-orders` | JWT | `Order[]` | `MyOrders.jsx` |
| GET | `/manage-orders` | JWT + Seller | `Order[]` | `ManageOrders.jsx` ⚠️ update URL |
| PATCH | `/orders/status/:id` | JWT + owner/admin | Mongo update result | `SellerOrderDataRow.jsx` |
| DELETE | `/orders/:id` | JWT + owner/admin | Mongo delete result | `SellerOrderDataRow.jsx` |
| GET | `/user/role` | JWT | `{ role }` | `useRole.jsx` |
| GET | `/users` | JWT + Admin | `User[]` | `ManageUsers.jsx` |
| PATCH | `/update-role` | JWT + Admin | Mongo update result | `UpdateUserRoleModal.jsx` |
| POST | `/become-decorator` | JWT | Mongo insert result | `BecomeSellerModal.jsx` |
| GET | `/decorator-requests` | JWT + Admin | `DecoratorRequest[]` | `SellerRequests.jsx` |
| GET | `/dashboard/stats` | JWT | `{ success, role, data }` (role-shaped KPIs) | Dashboard Statistics |
| GET | `/dashboard/analytics` | JWT | `{ success, role, data }` (chart series) | Dashboard Analytics |

### Dashboard response shapes

**`GET /dashboard/stats`** — response always `{ success: true, role, data }`.

| Role | `data` fields |
|------|----------------|
| `admin` | `totalRevenue`, `totalOrders`, `totalServices`, `totalUsers`, `pendingOrders`, `pendingDecoratorRequests`, `revenueGrowth`, `ordersGrowth`, `recentOrders` |
| `seller` | `myRevenue`, `myTotalOrders`, `myServices`, `pendingOrders`, `revenueGrowth`, `ordersGrowth`, `recentOrders` |
| `customer` | `totalSpent`, `totalOrders`, `pendingOrders`, `deliveredOrders`, `spendingGrowth`, `recentOrders` |

Growth fields are integers (percent vs previous calendar month). `recentOrders` is the last 5 orders for that scope.

**`GET /dashboard/analytics?period=30d`**

| Query | Values | Default |
|-------|--------|---------|
| `period` | `7d`, `30d`, `90d`, `1y` | `30d` |

`data` always:

| Field | Shape |
|-------|--------|
| `monthlyRevenue` | `[{ year, month, revenue }]` |
| `monthlyBookings` | `[{ year, month, bookings }]` |
| `categoryBreakdown` | `[{ category, count }]` |
| `statusBreakdown` | `[{ status, count }]` |

Scope: admin = all orders; seller = `seller.email === token email`; customer = `customer === token email`.

Order `status` values in DB: `pending`, `processing`, `delivered`, `cancelled`.

### Removed (B8)

| Method | Path | Reason |
|--------|------|--------|
| ~~POST~~ | ~~`/user`~~ | User creation → `/auth/register` or `/auth/firebase-sync` |

### Breaking URL changes (B8)

| Old | New |
|-----|-----|
| `GET /my-inventory/:email` | `GET /my-inventory` (uses token email) |
| `GET /manage-orders/:email` | `GET /manage-orders` (uses token email) |

---

## DB Collections

`styleDecorDB` → `services`, `orders`, `users`, `refreshTokens`, `decoratorRequests`

---

## Known Gaps

- Response format inconsistent (raw Mongo results vs `{ role }` vs `{ url }`)
- Frontend still calls old URLs (`/my-inventory/:email`, `/manage-orders/:email`) — use token-based paths above
- Older orders may lack `createdAt`; stats/analytics date filters use ObjectId timestamp as fallback

---

## Env Vars

See `style-decor-api-mvc/.env.example`
