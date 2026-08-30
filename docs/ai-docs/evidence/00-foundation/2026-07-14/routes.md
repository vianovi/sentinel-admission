# Foundation Route Evidence

- Command: `php artisan route:list --except-vendor --json`
- Result: PASS
- Total application routes: 183

## Methods

| Method | Count |
|---|---:|
| GET/HEAD | 97 |
| POST | 57 |
| DELETE | 13 |
| PUT | 12 |
| PUT/PATCH | 3 |
| PATCH | 1 |

## Key middleware counts

| Middleware | Count |
|---|---:|
| web | 182 |
| authenticated | 162 |
| admin role | 78 |
| candidate role | 50 |
| staff role | 30 |
| sensitive-file throttle | 10 |
| upload throttle | 3 |
| signed verification route | 1 |

The Midtrans webhook is the one route outside the `web` middleware stack. Its authenticity and idempotency require Task 05. Role counts reflect route middleware registration, not proof that controller object ownership is correct.
