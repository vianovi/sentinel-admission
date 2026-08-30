# Task 05 — Payment, Dynamic Fees, and Midtrans

## Scope

Audit wave fees, additional components, invoices/orders, Midtrans creation/status/webhooks, manual fallback if real, staff payment operations, and lifecycle integration.

## Audit focus

- authoritative fee calculation;
- dynamic wave/additional fees;
- server-generated order identity/amount;
- transaction/order uniqueness;
- webhook signature/authenticity;
- idempotency/replay;
- amount/currency/status consistency;
- pending/settlement/capture/expiry/deny/cancel/refund paths actually supported;
- polling/sync;
- manual-proof fallback policy;
- staff override authority;
- safe logs/payloads;
- payment ownership;
- lifecycle synchronization;
- sandbox tests with synthetic payloads.

Any financial-policy, fee-calculation, or manual-override change requires explicit approval.

## General constraints

- Verify actual source before relying on task hints.
- No schema, production dependency, business-policy, or production-operation change without authority.
- No visual approval claim.
- Store detailed evidence and update durable state.
- Apply all relevant release gates.
