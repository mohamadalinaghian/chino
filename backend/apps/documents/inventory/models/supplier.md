# Supplier

## Purpose

Store data about product supplier.

---

## Fields

- company_name
- info
- related_products

---

## Relations

- **Related_product** -> Product (Many To Many)
  (One supplier can supply many product and one product can supplied with many suppliers)

---

## Indexes

- company_name
- product

---

## Rules

- Unique company_name
- Query set for reverse relation to Visitors.

## Example

##### Add a coffee roaster info.

- company_name: **Mao Coffee**
- info: it's an online shop with hosting in Tehran, connection is its site
  https://moa-coffee.ir
- related_products: Special coffee bean, commercial coffee bean, mixed coffee 50-50
