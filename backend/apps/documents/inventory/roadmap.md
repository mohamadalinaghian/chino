# Roadmap (priority-based, dependency-first)

## 0. Preflight

- [x] init testing stack: pytest, pytest-django, factory_boy, coverage
- [x] add `make test`, `make lint`, `pre-commit`
- [x] add `apps/<app>/services/__init__.py` + `tests/` layout
- [x] CI minimal (run tests + flake8/ruff + isort)

---

## 1. Core roots

### 1.1 Product

- [x] model + migration
- [x] factory `ProductFactory`
- [x] service: `product.get_or_create`, `product.diactivate_product`
- [x] tests: model (fields, clean), service
- [x] admin

### 1.2 Supplier

- [x] model
- [x] SupplierProduct model + migration
- [x] inline admin for SupplierProduct
- [x] admin
- [x] factory `SupplierFactory`
- [x] tests: model

---

## 2. Purchasing backbone

### 2.1 SupplierProduct (depends: Product, Supplier)

- [x] admin
- [x] factory `SupplierProductFactory`
- [x] tests: model

### 2.2 PurchaseInvoice (depends: Supplier)

- [x] model + migration
- [x] admin
- [x] factory `PurchaseInvoiceFactory`
- [x] tests: model, service

### 2.3 PurchaseItem (depends: PurchaseInvoice, Product/SupplierProduct)

- [x] model + migration
- [x] admin
- [x] factory `PurchaseItemFactory`
- [x] service: item validation
- [x] tests: model, service

### 2.4 ExpiryPurchaseItem (depends: PurchaseItem)

- [x] model + migration
- [x] admin
- [x] factory `ExpiryPurchaseItemFactory`
- [x] service
- [x] tests: model, service

### 2.x Purchasing integration

- [ ] integration test: invoice posting creates FIFO stock entries (reserved)
- [ ] fixtures for typical invoices
- [ ] sample data fixtures (`fixtures/minimal.json`)

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

<<<=== FILE SEPARATOR ===>>>

<<<=== FILE SEPARATOR ===>>>

<<<=== FILE SEPARATOR ===>>>
