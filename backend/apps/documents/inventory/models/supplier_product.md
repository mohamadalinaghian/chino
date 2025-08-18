# Supplier Product

## Purpose

This model defines the many-to-many relationship between Supplier and Product.  
It stores supplier-details for each product, such as brand and last recorded purchase price.

---

## Fields

- `supplier` → ForeignKey to Supplier (who provides the product).
- `product` → ForeignKey to Product (the product being supplied).
- `brand` → Optional string. Brand name of the product provided by the supplier.
- `last_purchase_price` → Decimal. Latest known purchase unit price from this supplier.
- `last_price_date` → Date. The date when the last price was recorded.

---

## Relations

- Many-to-many between Supplier and Product is resolved via this model.
- Connected with `PurchaseItem` through post-save signal (see Rules).

---

## Indexes

- Unique constraint: `(supplier, product, brand)` → ensures no duplicate entries per supplier-product-brand.

---

## Rules

1. Every PurchaseItem creation must update the corresponding SupplierProduct entry with the new price and date.
2. If SupplierProduct does not exist, it should be created automatically.

---

## Example

If supplier _ABC Coffee_ provides product _Arabica Beans_ under brand _Lavazza_, the SupplierProduct row will store the latest unit price and the date of the last purchase.
