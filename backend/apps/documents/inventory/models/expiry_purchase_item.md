# Expiry Purchase Item

## Purpose

To store products expiry date and managing them.

---

## Fields

- purchased_item
- expiry_date

---

## Indexes

- purchased_item
- expiry_date
- expiry_date && purchased_item

---

## Rules

- Provide a query set method to retrieve items expiring within N days

---

## Example

##### Adding an item that will expiry in a month

- purchased_item: PurchaseItem(id=3323, name=`milk`)
- expiry_date: 1404/06/30
