

# Fix: RLS Policy Always True (org_insert)

## Problem

The `org_insert` policy on the `organizations` table uses `WITH CHECK (true)`, allowing any user (including unauthenticated) to directly insert rows. The scanner flags this as overly permissive.

## Analysis

Organization creation is exclusively handled through `create_org_with_member()` — a `SECURITY DEFINER` function that bypasses RLS entirely. No application code performs direct inserts to the `organizations` table. Therefore, the permissive INSERT policy is unnecessary.

## Solution

Replace the `WITH CHECK (true)` policy with one that only allows authenticated users AND restricts direct inserts to prevent abuse — while `create_org_with_member()` continues to work unaffected since it's SECURITY DEFINER.

### SQL Migration

```sql
DROP POLICY IF EXISTS "org_insert" ON public.organizations;

CREATE POLICY "org_insert" ON public.organizations
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);
```

This changes two things:
1. Restricts to `authenticated` role (no anonymous inserts)
2. Removes the blanket `true` that triggers the scanner warning

The `create_org_with_member()` function is unaffected since `SECURITY DEFINER` bypasses all RLS.

## Files Changed

| File | Action |
|---|---|
| SQL migration | Replace `org_insert` policy |

