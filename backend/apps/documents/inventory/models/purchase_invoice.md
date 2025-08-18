# Purchase Invoice

## Purpose

Meta data about an invoice.

## Fields

- issue_date
- time_stamped
- staff
- ~~payments_method~~
  (null)
- supplier
  (null)

---

## Indexes

- issue_date
- supplier
- ~~payments_method~~
- ~~issue_date && payments_method~~
- issue_date && supplier

---

## Relations

- **supplier** -> **Supplier** (One To Many)
- **staff** -> **User** (One To Many)
- ~~**Payments_method** -> unknown (Many To Many)~~

---

## Rules

- The staff field must reference a currently active staff user
- Query set for filter issue_date

---

## Examples

- Coffee invoice from **Moa Coffee** on 1404/05/25:
- issue_date: 1404/05/25
- created_at: 1404/05/28 (perhaps accountant is busy)
- updated_at: None
- staff: User(id=1, name=`Mohamad Alinaghian`)
- supplier: Moa Coffee
- ~~payments_method: Mehr bank (we need changes here)~~
