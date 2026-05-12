# Lyrup -- Manual RLS Cross-Tenant Smoke Test Runbook

This runbook verifies that Row Level Security (RLS) is correctly configured so
that one authenticated user cannot read or write another user's data.

Run this test after applying all Supabase migrations and before promoting any
deployment to production.

**Time required**: approximately 15 minutes.

---

## Table of Contents

1. [What We Are Testing](#1-what-we-are-testing)
2. [Pre-requisites](#2-pre-requisites)
3. [Step 1 -- Create User A](#3-step-1--create-user-a)
4. [Step 2 -- Create User B](#4-step-2--create-user-b)
5. [Step 3 -- User A Inserts a Printer](#5-step-3--user-a-inserts-a-printer)
6. [Step 4 -- User B Cannot See User A Data](#6-step-4--user-b-cannot-see-user-a-data)
7. [Step 5 -- User B Cannot Write to User A Data](#7-step-5--user-b-cannot-write-to-user-a-data)
8. [Step 6 -- Cleanup](#8-step-6--cleanup)
9. [Expected Results Summary](#9-expected-results-summary)
10. [How to Spot a Leak](#10-how-to-spot-a-leak)

---

## 1. What We Are Testing

Supabase enforces RLS policies at the Postgres level. When a user is authenticated
via the anon key (the key used by the browser and middleware), every query runs
under that user JWT and Postgres evaluates RLS policies.

The policies applied in `002_cotizador_schema.sql` ensure:

| Table | Policy |
|---|---|
| `printers` | ALL operations only where `user_id = auth.uid()` |
| `materials` | ALL operations only where `user_id = auth.uid()` |
| `quotes` | ALL operations only where `user_id = auth.uid()` |
| `quote_items` | ALL operations only where `quote.user_id = auth.uid()` |
| `users` | SELECT/INSERT/UPDATE only where `id = auth.uid()` |

This test verifies the `printers` table isolation as a representative example.
If `printers` is isolated, the same pattern applies to `materials` and `quotes`.

---

## 2. Pre-requisites

- Access to the Supabase project dashboard (SQL Editor and Authentication tabs).
- A deployed or locally-running instance of the app (for option A), OR
  the Supabase project URL and anon key (for option B -- curl / SQL Editor).
- Migrations `001_waitlist.sql` and `002_cotizador_schema.sql` applied.
- Email confirmation disabled in Supabase (recommended for testing):
  Supabase Dashboard > Authentication > Providers > Email > disable "Confirm email".
  Re-enable after testing if desired.

---

## 3. Step 1 -- Create User A

**Option A -- via the app Register page (recommended)**

1. Open the app at `http://localhost:3000` (or the preview URL).
2. Navigate to `/register`.
3. Sign up with: `user-a-test@example.com` / `TestPassword123!`
4. Complete the onboarding wizard (any values are fine).
5. You should land on `/dashboard`. User A is now active.

**Option B -- via Supabase Dashboard**

1. Supabase Dashboard > Authentication > Users > **Invite user**.
2. Enter `user-a-test@example.com`.
3. In the SQL Editor, verify the `users` row was auto-created by the trigger:

   ```sql
   SELECT id, email, onboarding_completed FROM public.users
   WHERE email = 'user-a-test@example.com';
   ```

   Expected: 1 row returned.

Note the UUID shown -- this is **User A UID**. Copy it for Step 4.

---

## 4. Step 2 -- Create User B

Repeat Step 1 Option A or B with a different email:
`user-b-test@example.com` / `TestPassword123!`

Complete onboarding or skip (not required for the test).

Note **User B UID** for Step 4.

---

## 5. Step 3 -- User A Inserts a Printer

**Option A -- via the app (onboarding)**

If User A completed onboarding, a `printers` row was inserted automatically.
Verify it exists in the SQL Editor:

```sql
SELECT id, user_id, model_name FROM public.printers
WHERE user_id = (
  SELECT id FROM public.users WHERE email = 'user-a-test@example.com'
);
```

Expected: 1 or more rows. Note the `id` of one row -- this is **Printer A ID**.

**Option B -- manual insert via SQL Editor (service role, bypasses RLS)**

```sql
INSERT INTO public.printers (user_id, model_name, purchase_price_ars, power_watts)
VALUES (
  (SELECT id FROM public.users WHERE email = 'user-a-test@example.com'),
  'Bambu Lab A1 Mini',
  850000,
  400
)
RETURNING id, user_id, model_name;
```

Note the returned `id` -- this is **Printer A ID**.

---

## 6. Step 4 -- User B Cannot See User A Data

This is the critical cross-tenant isolation check.

### Method A -- Supabase SQL Editor with RLS simulation

The SQL Editor runs queries with the service role (bypasses RLS). To simulate
a user-scoped query, use `SET LOCAL ROLE` inside a transaction:

```sql
-- Get User B UID first
SELECT id FROM public.users WHERE email = 'user-b-test@example.com';
-- Copy the UUID returned (e.g. 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')

BEGIN;

-- Simulate User B JWT context
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "PASTE_USER_B_UID_HERE", "role": "authenticated"}';

-- Query printers -- should return ZERO rows for User A printer
SELECT id, user_id, model_name FROM public.printers;

ROLLBACK;
```

**Expected result**: 0 rows returned (or only rows owned by User B if they also
completed onboarding). User A printer must NOT appear.

### Method B -- curl with User B session token

> **Windows PowerShell note**: `curl` in PowerShell is an alias for
> `Invoke-WebRequest` — NOT the real curl binary. Use `curl.exe` explicitly
> to call the real curl, or use the `Invoke-RestMethod` blocks provided below.

1. Sign in as User B and capture the JWT:

   **Bash / macOS / Linux / Git Bash:**
   ```bash
   curl -s -X POST \
     'https://YOUR_PROJECT_REF.supabase.co/auth/v1/token?grant_type=password' \
     -H 'apikey: YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"email": "user-b-test@example.com", "password": "TestPassword123!"}' \
     | python3 -m json.tool | grep access_token
   ```

   **Windows PowerShell (curl.exe):**
   ```powershell
   curl.exe -s -X POST `
     'https://YOUR_PROJECT_REF.supabase.co/auth/v1/token?grant_type=password' `
     -H 'apikey: YOUR_ANON_KEY' `
     -H 'Content-Type: application/json' `
     -d '{\"email\": \"user-b-test@example.com\", \"password\": \"TestPassword123!\"}' `
     | python3 -m json.tool
   ```
   > In PowerShell, double quotes inside `-d` strings must be escaped as `\"`.

   **Windows PowerShell (Invoke-RestMethod):**
   ```powershell
   $response = Invoke-RestMethod `
     -Method POST `
     -Uri 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/token?grant_type=password' `
     -Headers @{ 'apikey' = 'YOUR_ANON_KEY'; 'Content-Type' = 'application/json' } `
     -Body '{"email": "user-b-test@example.com", "password": "TestPassword123!"}'
   $response.access_token
   ```

2. Copy the `access_token` value.

3. Query the `printers` table as User B:

   **Bash / macOS / Linux / Git Bash:**
   ```bash
   curl -s \
     'https://YOUR_PROJECT_REF.supabase.co/rest/v1/printers?select=id,user_id,model_name' \
     -H 'apikey: YOUR_ANON_KEY' \
     -H 'Authorization: Bearer PASTE_ACCESS_TOKEN_HERE' \
     -H 'Content-Type: application/json'
   ```

   **Windows PowerShell (curl.exe):**
   ```powershell
   curl.exe -s `
     'https://YOUR_PROJECT_REF.supabase.co/rest/v1/printers?select=id,user_id,model_name' `
     -H 'apikey: YOUR_ANON_KEY' `
     -H 'Authorization: Bearer PASTE_ACCESS_TOKEN_HERE' `
     -H 'Content-Type: application/json'
   ```

   **Windows PowerShell (Invoke-RestMethod):**
   ```powershell
   Invoke-RestMethod `
     -Uri 'https://YOUR_PROJECT_REF.supabase.co/rest/v1/printers?select=id,user_id,model_name' `
     -Headers @{
       'apikey'        = 'YOUR_ANON_KEY'
       'Authorization' = 'Bearer PASTE_ACCESS_TOKEN_HERE'
       'Content-Type'  = 'application/json'
     }
   ```

**Expected result**: `[]` (empty array) if User B never inserted a printer, OR
only User B own printers. User A printer ID must NOT appear.

### Method C -- via the app (if printer listing UI exists)

Sign in as User B. Navigate to any UI that lists printers. Verify that User A
printer (model name "Bambu Lab A1 Mini" from Step 3) does NOT appear.

---

## 7. Step 5 -- User B Cannot Write to User A Data

Verify User B cannot UPDATE or DELETE User A printer via the API.

### Attempt UPDATE (should silently affect 0 rows)

**Bash / macOS / Linux / Git Bash:**
```bash
curl -s -X PATCH \
  'https://YOUR_PROJECT_REF.supabase.co/rest/v1/printers?id=eq.PRINTER_A_ID' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer PASTE_USER_B_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '{"model_name": "HACKED"}'
```

**Windows PowerShell (curl.exe):**
```powershell
curl.exe -s -X PATCH `
  'https://YOUR_PROJECT_REF.supabase.co/rest/v1/printers?id=eq.PRINTER_A_ID' `
  -H 'apikey: YOUR_ANON_KEY' `
  -H 'Authorization: Bearer PASTE_USER_B_TOKEN_HERE' `
  -H 'Content-Type: application/json' `
  -H 'Prefer: return=representation' `
  -d '{\"model_name\": \"HACKED\"}'
```

**Windows PowerShell (Invoke-RestMethod):**
```powershell
Invoke-RestMethod `
  -Method PATCH `
  -Uri 'https://YOUR_PROJECT_REF.supabase.co/rest/v1/printers?id=eq.PRINTER_A_ID' `
  -Headers @{
    'apikey'        = 'YOUR_ANON_KEY'
    'Authorization' = 'Bearer PASTE_USER_B_TOKEN_HERE'
    'Content-Type'  = 'application/json'
    'Prefer'        = 'return=representation'
  } `
  -Body '{"model_name": "HACKED"}'
```

**Expected result**: `[]` (empty array -- 0 rows updated). Postgres RLS filters
out the row before the write lands.

Confirm in SQL Editor (service role):

```sql
SELECT model_name FROM public.printers WHERE id = 'PRINTER_A_ID';
```

The `model_name` must still be `Bambu Lab A1 Mini`.

### Attempt DELETE (should silently affect 0 rows)

**Bash / macOS / Linux / Git Bash:**
```bash
curl -s -X DELETE \
  'https://YOUR_PROJECT_REF.supabase.co/rest/v1/printers?id=eq.PRINTER_A_ID' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer PASTE_USER_B_TOKEN_HERE' \
  -H 'Prefer: return=representation'
```

**Windows PowerShell (curl.exe):**
```powershell
curl.exe -s -X DELETE `
  'https://YOUR_PROJECT_REF.supabase.co/rest/v1/printers?id=eq.PRINTER_A_ID' `
  -H 'apikey: YOUR_ANON_KEY' `
  -H 'Authorization: Bearer PASTE_USER_B_TOKEN_HERE' `
  -H 'Prefer: return=representation'
```

**Windows PowerShell (Invoke-RestMethod):**
```powershell
Invoke-RestMethod `
  -Method DELETE `
  -Uri 'https://YOUR_PROJECT_REF.supabase.co/rest/v1/printers?id=eq.PRINTER_A_ID' `
  -Headers @{
    'apikey'        = 'YOUR_ANON_KEY'
    'Authorization' = 'Bearer PASTE_USER_B_TOKEN_HERE'
    'Prefer'        = 'return=representation'
  }
```

**Expected result**: `[]` (0 rows deleted). Confirm the row still exists via
the SQL Editor.

---

## 8. Step 6 -- Cleanup

After the test, delete the two test users to keep the database clean.

In Supabase Dashboard > Authentication > Users:
1. Find `user-a-test@example.com` > three-dot menu > **Delete user**.
2. Find `user-b-test@example.com` > three-dot menu > **Delete user**.

Deleting from `auth.users` cascades to `public.users` via the foreign key in
`002_cotizador_schema.sql`. Related rows in `printers`, `materials`, etc. also
cascade-delete.

Alternatively, in the SQL Editor:

```sql
-- Cascades to public.users, printers, materials, etc.
DELETE FROM auth.users WHERE email IN (
  'user-a-test@example.com',
  'user-b-test@example.com'
);
```

---

## 9. Expected Results Summary

| Test | Expected result | Pass indicator |
|---|---|---|
| User A creates printer (Step 3) | 1 row in `printers` with `user_id = User A UID` | Row exists in SQL Editor |
| User B queries `printers` (Step 4) | 0 rows from User A visible | Empty array / 0 rows in query |
| User B attempts UPDATE on Printer A (Step 5) | 0 rows updated | `model_name` unchanged in SQL Editor |
| User B attempts DELETE on Printer A (Step 5) | 0 rows deleted | Row still exists in SQL Editor |

If ALL four checks pass: RLS is working correctly. Proceed to production.

---

## 10. How to Spot a Leak

A **RLS leak** has occurred if any of the following happen:

- User B query in Step 4 returns User A printer row.
- User B PATCH in Step 5 returns a non-empty array (rows updated > 0).
- User B DELETE in Step 5 returns a non-empty array (rows deleted > 0).
- SQL Editor confirms `model_name` changed to `HACKED`.

**What to do if you find a leak:**

1. Do NOT deploy to production.
2. Check `002_cotizador_schema.sql`: verify `ALTER TABLE printers ENABLE ROW LEVEL SECURITY`
   is present AND the policy uses `user_id = auth.uid()`.
3. Confirm the policy is `FOR ALL` (not just SELECT).
4. Check that Supabase RLS is not globally disabled:
   Supabase Dashboard > Database > Tables > `printers` > RLS must show "Enabled".
5. Run `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM printers` inside the simulated
   JWT context from Step 4 to see which filter is applied.
6. Fix the policy, re-run the smoke test, then redeploy.
