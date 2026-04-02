

# Remove Two Guest Records

## Problem
Two duplicate guest records for "Leonardo" / "leonardo" (email: leomateus620@gmail.com) need to be deleted from the database.

## Records to Delete
| ID | Nome |
|---|---|
| `c158f8a0-1486-4276-8cd0-0a305e8edaf3` | leonardo |
| `2b9ec6f2-692d-41b5-83b8-d9f411b4d090` | Leonardo |

## Plan

### 1. SQL Migration
Delete the two guest records and their associated `transport_guests` links:

```sql
DELETE FROM transport_guests WHERE guest_id IN (
  'c158f8a0-1486-4276-8cd0-0a305e8edaf3',
  '2b9ec6f2-692d-41b5-83b8-d9f411b4d090'
);

DELETE FROM guests WHERE id IN (
  'c158f8a0-1486-4276-8cd0-0a305e8edaf3',
  '2b9ec6f2-692d-41b5-83b8-d9f411b4d090'
);
```

No frontend code changes needed — the guest list is fetched dynamically via React Query.

## Files Changed

| File | Action |
|---|---|
| SQL migration | Delete 2 guest records + transport_guests links |

