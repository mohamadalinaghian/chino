# Stock

## Purpose

It's middleware model to store products that have remaining quantity.
record will be deleted if remaining quantity raise to Zero so search would be easier.
**This model is not for reports only used for daily calculations**.

---

## Fields

- stored_product
- initial_quantity
- unit_price
- remaining_quantity
- created_at

---

## Relations

- stored_product => Product (One To Many)
- created_at => PurchaseInvoice (One To Many)

---

## Indexes

- stored_product
- created_at
- stored_product, created_at

---

## Rules

- remaining_quantity < initial_quantity
- if remaining_quantity == 0 then delete

## Example

purchasing milk.

- stored_product: Product(id=33, name=`milk`)
- created_at: 1404/02/12
- initial_quantity: 2000
- remaining_quantity: 400
