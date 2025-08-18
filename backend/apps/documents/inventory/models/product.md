# Product

## Purpose

Store all the metadata about any kind of product and goods that use in café.

---

## Example

##### Raw Material

- milk, onion, coffee bean, garlic, oil

##### Processed item

- roast beef, vanilla milk,

##### Sell item

- espresso, cheese burger, shake, pasta

##### Consumable

- toilet paper, soap

---

## Fields

- name
- expiry_traceable
- notes
- countable
- type
- stock_traceable

---

## Indexes

- name
- type

---

## Rules

- Unique (name, type)

---

## Usage

- Adding metadata about:
  - Milk: expiry traceable, weightily and is a raw material
  - Vanilla milk: a processed item that measure with weight and we need to trace its expiry duration
  - espresso: a menu item for sell
  - Toilet paper: is a consumable product that maybe i can trace its stock

---

- ### Fields
  - #### Product 1
    - name: milk
    - type: PRODUCTTYPE.RAW
    - notes: None
    - expiry_traceable: True
    - stock_traceable: True
    - countable: False

---

- #### Product 2
  - name: vanilla milk
  - type: PRODUCTTYPE.PROCESSED
  - notes: None
  - expiry_traceable: True
  - stock_traceable: True
  - countable: True

---

- #### Product 3
  1. name: espresso
  2. type: PRODUCTTYPE.FORSELL
  3. notes: None
  4. expiry_traceable: False
  5. stock_traceable: True
  6. countable: True

---

- #### Product 4
  1. name: toilet paper
  2. type: PRODUCTTYPE.CONSUMABLE
  3. notes: None
  4. expiry_traceable: False
  5. stock_traceable: True
  6. countable: True
