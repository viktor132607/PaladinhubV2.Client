# Backend endpoint alignment

The client is configured against the ASP.NET backend root, not an assumed `/api` root:

```env
NEXT_PUBLIC_API_URL=http://localhost:10000
```

## Existing backend routes used by the client

- `/Merchandise`
- `/Product/Details?id={id}`
- `/Product/Create`
- `/Cart/MyCart`
- `/Cart/AddProduct/{id}`
- `/Checkout/Start`
- `/Account/Login`
- `/Account/LogoutGet`
- `/Account/MyAccount`
- `/Account/TransactionHistory`
- `/Admin/Database`
- `/Admin/Items/Create`
- `/Admin/Spells/Create`
- `/Admin/PageBuilder/Create`
- `/Admin/PromoCodes/Create`
- `/api/talents/{key}`
- `/api/blocks/render`
- `/api/blocks/render-layout`
- `/api/presets`
- `/Admin/api/pages/{id}/head`
- `/Admin/api/pages/{id}/layout`

## Removed template contracts

The migrated backend does not expose the previous template endpoints for:

- `/api/Auth/*`
- `/api/Products`
- `/api/Categories`
- `/api/Orders`
- `/api/Users`
- `/api/Reviews`
- `/api/Wishlist`
- `/api/Gdpr`
- `/api/contact`

Client requests to those routes were removed. Pages without a backend counterpart now state that the capability is not currently exposed instead of issuing failing requests.
