# Recipe

## Purpose

Store the metadata about a product's recipe.

---

## Fields

- name
- produced_product
- time_stamped
- instruction

---

## Relations

- **produced_product** => Product (One To Many)

---

## Indexes

- name
- produced_product
- produced_product && created_at

---

## Rules

- Unique name

---

## Example

**Creating recipe of vanilla milk**

_pure 1000 gr milk to mixer, adding 500 gr cream and 200 gr sugar.
mix them for 1 minute and rest for 5 minutes_

#### Fields

1. name: vanilla milk
2. produced_product: Product(id=33, name=`vanilla milk`)
3. created_at: 1402/02/02
4. updated_at: None
5. instruction: mix all together
