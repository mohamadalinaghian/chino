# Roadmap (priority-based, dependency-first)

## 0. Preflight

- [ ] init testing stack: pytest, pytest-django, factory_boy, coverage
- [ ] add `make test`, `make lint`, `pre-commit`
- [ ] add `apps/<app>/services/__init__.py` + `tests/` layout
- [ ] CI minimal (run tests + flake8/ruff + isort)
- [ ] sample data fixtures (`fixtures/minimal.json`)

---

## 1. Core roots

### 1.1 Product

- [x] model + migration
- [ ] admin
- [ ] factory `ProductFactory`
- [ ] service: `product.get_or_create_sku`, `product.validate_unit`
- [ ] tests: model (fields, clean), service

### 1.2 Supplier

- [ ] model + migration
- [ ] admin
- [ ] factory `SupplierFactory`
- [ ] service: `supplier.upsert`
- [ ] tests: model, service

---

## 2. Purchasing backbone

### 2.1 SupplierProduct (depends: Product, Supplier)

- [ ] model + migration
- [ ] admin
- [ ] factory `SupplierProductFactory`
- [ ] service: price policy, default pack size
- [ ] tests: model, service

### 2.2 PurchaseInvoice (depends: Supplier)

- [ ] model + migration
- [ ] admin
- [ ] factory `PurchaseInvoiceFactory`
- [ ] service: create + status transitions (draft→posted)
- [ ] tests: model, service

### 2.3 PurchaseItem (depends: PurchaseInvoice, Product/SupplierProduct)

- [ ] model + migration
- [ ] admin
- [ ] factory `PurchaseItemFactory`
- [ ] service: item validation, tax/discount calc
- [ ] tests: model, service

### 2.4 ExpiryPurchaseItem (depends: PurchaseItem)

- [ ] model + migration
- [ ] admin
- [ ] factory `ExpiryPurchaseItemFactory`
- [ ] service: auto-split by expiry batch
- [ ] tests: model, service

### 2.x Purchasing integration

- [ ] integration test: invoice posting creates FIFO stock entries (reserved)
- [ ] fixtures for typical invoices

---

## 3. Stock engine

### 3.1 Stock (depends: Product, PurchaseItem)

- [ ] model + migration (`StockEntry` with `movement_type`: PURCHASE|PRODUCTION_IN|CONSUME|ADJUSTMENT|WASTE)
- [ ] admin
- [ ] factory `StockEntryFactory`
- [ ] service: `stock.post_purchase`, `stock.consume_fifo`, `stock.produce`, `stock.adjust`, `stock.waste`
- [ ] service: FIFO cost calculator (pure, deterministic)
- [ ] tests: model invariants, FIFO edge cases, negative prevention

### 3.x Stock integration

- [ ] integration test: posting invoice → `stock.post_purchase`
- [ ] integration test: querying on-hand by product and batch

---

## 4. Production

### 4.1 Recipe (depends: Product)

- [ ] model + migration
- [ ] admin
- [ ] factory `RecipeFactory`
- [ ] tests: model

### 4.2 RecipeComponent (depends: Recipe, Product)

- [ ] model + migration
- [ ] admin
- [ ] factory `RecipeComponentFactory`
- [ ] tests: model

### 4.3 ItemProduction (depends: Recipe, Stock)

- [ ] model + migration (stores unit_cost computed via FIFO at production time)
- [ ] admin
- [ ] factory `ItemProductionFactory`
- [ ] service: `production.produce(recipe, qty)` → consumes components via FIFO, produces target product, persists cost
- [ ] tests: model, service (costing), rollback safety on partial failure

### 4.4 ProductionConsumeReport (depends: ItemProduction)

- [ ] model + migration
- [ ] service: aggregate by date/product
- [ ] tests: model, service

### 4.x Production integration

- [ ] integration test: produce → consumes components + creates production_in entry
- [ ] integration test: produced item carries computed unit_cost

---

## 5. Inventory corrections

### 5.1 AdjustmentReport (depends: Stock, Product)

- [ ] model + migration
- [ ] admin
- [ ] factory
- [ ] service: `stock.adjust` (+/− with reason codes)
- [ ] tests: model, service

### 5.2 WastedReport (depends: Stock, Product)

- [ ] model + migration
- [ ] admin
- [ ] factory
- [ ] service: `stock.waste` (links to expiry or manual reason)
- [ ] tests: model, service

### 5.x Corrections integration

- [ ] integration test: adjustment and waste create correct stock movements and do not break FIFO layers

---

## 6. Other

### 6.1 Visitor (independent)

- [ ] model + migration
- [ ] admin
- [ ] factory
- [ ] tests

---

## 7. Full integration pass

- [ ] scenario A: purchase → stock on-hand → produce → cost flow → waste
- [ ] scenario B: multiple suppliers, mixed expiry, partial production
- [ ] scenario C: adjustments after production, cost invariants hold
- [ ] perf: `select_related/prefetch_related` on hot paths

---

## Definition of Done per unit

- [ ] model + migration, reversible
- [ ] admin minimal UX
- [ ] factory(ies)
- [ ] service functions with clear I/O and no DB side-effects outside the unit of work
- [ ] unit tests ≥ 90% for service, key branches covered
- [ ] integration tests for the group
- [ ] docs (README in app + docstrings on services)
