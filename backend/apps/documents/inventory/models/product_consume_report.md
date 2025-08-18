# Product Consume Report

## Purpose

It's a model for storing product consumption in produce.

---

## Fields

- consumed_product
- item_production_record
- consume_amount
- total_cost

---

## Relations

- consumed_product => Product (One To Many)
- item_production_record => ItemProduction (One To One)

---

## Indexes

- consumed_product

---

## Example

From producing vanilla milk:

- #### Consumed Product 1
  1. consumed_product: Product(id=33, name=`milk`)
  2. item_production_record: ItemProduction(id=5432, created_at=1404/02/02)
  3. consume_amount: Decimal('700')
  4. total_cost: Decimal('33,000')

---

- #### Consumed Product 2
  1. consumed_product: Product(id=22, name=`cream`)
  2. item_production_record: ItemProduction(id=5432, created_at=1404/02/02)
  3. consume_amount: Decimal(`300`)
  4. total_cost: Decimal(`50,000`)

---

- #### Consumed Product 3
  1. consumed_product: Product(id=11, name=`sugar`)
  2. item_production_record: ItemProduction(id=5432, created_at=1404/02/02)
  3. consume_amount: Decimal(`100`)
  4. total_cost: Decimal(`15,500`)
