# Style-Decor API Contract (Phase 0 Baseline)

> Refactor-এ এই URLs ও response shape same রাখতে হবে।  
> Base URL: `VITE_API_URL` (frontend `.env`)

## Endpoints

| Method | Path | Auth | Response (current) | Frontend |
|--------|------|------|-------------------|----------|
| GET | `/` | Public | `"Hello from Server.."` | — |
| GET | `/services` | Public | `Service[]` | `ServiceList.jsx` |
| GET | `/services/:id` | Public | `Service` | `ServiceDetails.jsx` |
| POST | `/services` | JWT + Seller | Mongo `insertOne` result | `AddPlantForm.jsx` |
| PATCH | `/services/:id` | JWT + Seller | Mongo `updateOne` result | `UpdatePlantForm.jsx` |
| DELETE | `/services/:id` | JWT + Seller | Mongo `deleteOne` result | `DeleteModal.jsx` (`/services`) |
| GET | `/my-inventory/:email` | JWT + Seller | `Service[]` | `MyInventory.jsx` |
| POST | `/create-checkout-session` | Public | `{ url }` | `PurchaseModal.jsx` |
| POST | `/payment-success` | Public | `{ transactionId, orderId }` | `PaymentSuccess.jsx` |
| GET | `/my-orders` | JWT | `Order[]` | `MyOrders.jsx` |
| GET | `/manage-orders/:email` | JWT + Seller | `Order[]` | `ManageOrders.jsx` |
| PATCH | `/orders/status/:id` | **None** ⚠️ | Mongo `updateOne` result | `SellerOrderDataRow.jsx` |
| DELETE | `/orders/:id` | **None** ⚠️ | Mongo `deleteOne` result | `SellerOrderDataRow.jsx` |
| POST | `/user` | Public | Mongo insert/update result | `utils/index.js` |
| GET | `/user/role` | JWT | `{ role }` | `useRole.jsx` |
| GET | `/users` | JWT + Admin | `User[]` | `ManageUsers.jsx` |
| PATCH | `/update-role` | JWT + Admin | Mongo `updateOne` result | `UpdateUserRoleModal.jsx`, `SellerRequestsDataRow.jsx` |
| POST | `/become-decorator` | JWT | Mongo `insertOne` result | `BecomeSellerModal.jsx` |
| GET | `/decorator-requests` | JWT + Admin | `DecoratorRequest[]` | `SellerRequests.jsx` |

## Auth Header

Protected routes: `Authorization: Bearer <Firebase ID token>`  
Frontend uses `useAxiosSecure` hook (`baseURL: VITE_API_URL`).

## DB Collections

`styleDecorDB` → `services`, `orders`, `users`, `decoratorRequests`

## Known Gaps (fix during refactor)

- `PATCH /orders/status/:id` — no auth on backend
- `DELETE /orders/:id` — no auth on backend
- Email in URL (`/manage-orders/:email`, `/my-inventory/:email`) — should use `req.tokenEmail`
- Token/decoded user logged via `console.log` in production
- Response format inconsistent (raw Mongo results vs `{ role }` vs `{ url }`)

## Env Vars

See `.env.example`
