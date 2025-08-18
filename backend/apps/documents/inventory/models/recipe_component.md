# Recipe Component

---

## Purpose

All components of a recipe will be stored here with their usage amounts

---

## Fields

- recipe
- consume_product
- quantity

---

## Relations

- recipe => Recipe (One To Many)
- consume_product => Product (One To Many)

---

## Indexes

- recipe

---

## Rules

- Unique (recipe, consume_product)
- The sum of quantities for all consumed products in a recipe must equal 1

---

## Example

We use earlier recipe that we wrote for vanilla milk

- #### Component 1
  - recipe: Recipe(id=1, name=`vanilla milk`)
  - consume_product: Product(id=22, name=`milk`)
  - quantity: Decimal('0.6')

- #### Component 2
  - recipe: Recipe(id=1, name=`vanilla milk`)
  - consume_product: Product(id=33, name=`cream`)
  - quantity: Decimal('0.3')

- #### Component 3
  - recipe: Recipe(id=1, name=`vanilla milk`)
  - consume_product: Product(id=11, name=`sugar`)
  - quantity; Decimal('0.1')
