# Inventory Module

## Purpose

Manages products, suppliers, invoices, stock, recipes, production, and reports.
Keeps track of product availability, expiry dates, purchase history, and production costs.

---

## General Scenario

1. A supplier sends an invoice → `PurchaseInvoice` is created.
2. Each invoice contains `PurchaseItem` records (product, amount, unit price).
3. If products are expiry-traceable → `ExpiryPurchaseItem` is recorded.
4. Each purchase also updates/creates a `SupplierProduct` entry with last purchase price and date.
5. Stock is increased by purchased items → stored in `Stock`.
6. When producing a menu item:
   - Recipe (`Recipe` + `RecipeComponent`) defines required inputs.
   - `ItemProduction` deducts from stock using FIFO.
   - `ProductConsumeReport` records consumed items & costs.
   - Produced products can be traced in stock.
7. Reports can be generated:
   - `ProductAdjustmentReport` → human adjustments.
   - `ProductWastedReport` → waste or expiry losses.
   - `Supplier` & `Visitor` → supplier info & contacts.
   - `PurchaseInvoice` & `PurchaseItem` → purchase history.

---

## Models Overview

### Product

- Fields: `name`, `expiry_traceable`, `notes`, `countable`, `type`, `stock_traceable`
- Rules: Unique (`name`, `type`)

### Supplier

- Fields: `company_name`, `info`
- Rules: Unique `company_name`

### SupplierProduct

- Fields: `supplier`, `product`, `brand`, `last_purchase_price`, `last_price_date`
- Rules: Unique (`supplier`, `product`, `brand`)

### Visitor

- Fields: `name`, `phone_number`, `notes`, `related_supplier`
- Rules: Unique `phone_number`

### PurchaseInvoice

- Fields: `issue_date`, `staff`, `supplier`
- Rules: staff must be active

### PurchaseItem

- Fields: `purchase_invoice`, `purchased_product`, `purchased_amount`, `purchased_unit_price`
- Rules: Unique (`purchase_invoice`, `purchased_product`)

### ExpiryPurchaseItem

- Fields: `purchased_item`, `expiry_date`

### Stock

- Fields: `stored_product`, `initial_quantity`, `unit_price`, `remaining_quantity`, `created_at`
- Rules: delete if `remaining_quantity = 0`

### Recipe

- Fields: `name`, `produced_product`, `instruction`, `timestamped`
- Rules: Unique `name`

### RecipeComponent

- Fields: `recipe`, `consume_product`, `quantity`
- Rules: Unique (`recipe`, `consume_product`)

### ItemProduction

- Fields: `used_recipe`, `used_quantity`, `produced_quantity`, `cooperators`, `notes`, `timestamped`

### ProductConsumeReport

- Fields: `consumed_product`, `item_production_record`, `consume_amount`, `total_cost`

### ProductWastedReport

- Fields: `product`, `waste_date`, `quantity`, `notes`, `responsible`

### ProductAdjustmentReport

- Fields: `product`, `adjustment_report_date`, `movement_type`, `previous_quantity`, `adjustment_quantity`, `staff`

---

## Mermaid Diagram

```mermaid
erDiagram
  USER {
    int id PK
    string username
  }

  PRODUCT {
    int id PK
    string name
    string type
    boolean countable
    boolean expiry_traceable
    boolean stock_traceable
    text notes
  }

  SUPPLIER {
    int id PK
    string company_name
    text info
  }

  VISITOR {
    int id PK
    string name
    string phone_number
    text notes
    int supplier_id FK
  }

  SUPPLIER_PRODUCT {
    int id PK
    int supplier_id FK
    int product_id FK
    string brand
    decimal last_purchase_price
    date last_price_date
  }

  PURCHASE_INVOICE {
    int id PK
    date issue_date
    datetime created_at
    datetime updated_at
    int supplier_id FK
    int staff_id FK
  }

  PURCHASE_ITEM {
    int id PK
    int purchase_invoice_id FK
    int purchased_product_id FK
    string brand
    decimal purchased_amount
    decimal purchased_unit_price
  }

  EXPIRY_PURCHASE_ITEM {
    int id PK
    int purchased_item_id FK
    date expiry_date
  }

  RECIPE {
    int id PK
    string name
    int produced_product_id FK
    text instruction
    datetime created_at
    datetime updated_at
  }

  RECIPE_COMPONENT {
    int id PK
    int recipe_id FK
    int consume_product_id FK
    decimal quantity
  }

  ITEM_PRODUCTION {
    int id PK
    int used_recipe_id FK
    decimal used_quantity
    decimal produced_quantity
    text notes
    datetime created_at
  }

  PRODUCT_CONSUME_REPORT {
    int id PK
    int consumed_product_id FK
    int item_production_id FK
    decimal consume_amount
    decimal total_cost
  }

  PRODUCT_WASTED_REPORT {
    int id PK
    int product_id FK
    date waste_date
    decimal quantity
    text notes
    int responsible_id FK
  }

  PRODUCT_ADJUSTMENT_REPORT {
    int id PK
    int product_id FK
    date adjustment_report_date
    string movement_type
    decimal previous_quantity
    decimal adjustment_quantity
    int staff_id FK
  }

  STOCK {
    int id PK
    int stored_product_id FK
    decimal initial_quantity
    decimal remaining_quantity
    decimal unit_price
    datetime created_at
  }

  %% Relations
  SUPPLIER ||--o{ SUPPLIER_PRODUCT : offers
  PRODUCT  ||--o{ SUPPLIER_PRODUCT : supplied_as

  SUPPLIER ||--o{ VISITOR : has

  SUPPLIER ||--o{ PURCHASE_INVOICE : issues
  USER     ||--o{ PURCHASE_INVOICE : handled_by

  PURCHASE_INVOICE ||--o{ PURCHASE_ITEM : contains
  PRODUCT          ||--o{ PURCHASE_ITEM : purchased

  PURCHASE_ITEM        ||--o{ EXPIRY_PURCHASE_ITEM : has_expiry

  PRODUCT ||--o{ RECIPE : has
  RECIPE  ||--o{ RECIPE_COMPONENT : uses
  PRODUCT ||--o{ RECIPE_COMPONENT : ingredient

  RECIPE  ||--o{ ITEM_PRODUCTION : used_for
  USER    }o--o{ ITEM_PRODUCTION : cooperates

  ITEM_PRODUCTION ||--o{ PRODUCT_CONSUME_REPORT : generates
  PRODUCT         ||--o{ PRODUCT_CONSUME_REPORT : consumed

  PRODUCT ||--o{ PRODUCT_WASTED_REPORT : includes
  USER    ||--o{ PRODUCT_WASTED_REPORT : reported_by

  PRODUCT ||--o{ PRODUCT_ADJUSTMENT_REPORT : includes
  USER    ||--o{ PRODUCT_ADJUSTMENT_REPORT : adjusted_by

  PRODUCT ||--o{ STOCK : tracked_in
```
