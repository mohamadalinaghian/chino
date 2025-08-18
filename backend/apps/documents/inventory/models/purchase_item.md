# Purchase Invoice

## Purpose

Store every purchase item in a single record.

---

## Fields

- purchase_invoice
- purchased_product
- purchased_amount
- purchased_unit_price

## Relations

- **Purchase_invoice** to PurchaseInvoice (One To Many)
- **purchased_product** to Product (One To Many)

---

## Indexes

- purchase_invoice
- purchased_product

---

## Rules

- Total_cost cached_property to get purchased_amount \* purchased_unit_price
  (in fact from user we take this field but for performance we save unit_price.)
- Calculate purchase unit price and set the field.
- Unique together (purchase_invoice, purchased_product)
- Query set for get other purchases in same invoice
- On `post_save`, a signal must update the corresponding SupplierProduct:
  - If SupplierProduct(supplier, product, brand) exists → update `last_purchase_price` and `last_price_date`.
  - Otherwise → create a new SupplierProduct entry.

---

## Examples

#### Add invoice details that stored earlier in PurchaseInvoice:

##### First Item

- purchase_invoice: PurchaseInvoice(id=1, issue_date=`1404/05/25`)
- purchased_product: Product(id=45, name=`El salvador Coffee arabica`)
- purchased_amount: Decimal(`2000`)
- purchased_unit_price: after calculation from user input => Decimal(`4,500`)
- total_cost(@property): `2000` \* `4,500`

---

##### Second Item

- purchase_invoice: PurchaseInvoice(id=1, issue_date=`1404/05/25`)
- purchased_product: Product(id=123, name=`Mulish Coffee arabica`)
- purchased_amount: Decimal(`5000`)
- purchased_unit_price: after calculation from user input => Decimal(`2,700`)
