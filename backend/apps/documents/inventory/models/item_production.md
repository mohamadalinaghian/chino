# Item Production

## Purpose

Every item production in the café is stored in this model

---

## Fields

- used_recipe
- used_quantity
- produced_quantity
- cooperators
- timestamped
- notes

---

## Relations

- used_recipe => Recipe (One To Many)
- cooperators => User (Many To Many)

---

## Indexes

- used_recipe
- cooperators
- created_at

---
