# Visitor

---

## Purpose

Store suppliers visitor data.

---

## Fields

- name
- phone_number
- notes
- related_supplier

---

## Relations

- **related_supplier** -> Supplier (One To Many)

---

## Indexes

- name
- related_supplier

## Rules

- Unique **phone_number**

---

## Example

##### Add information about **Moa Coffee** visitor which not exist.

- name: Moa web site
- phone_number: 0XXXXXXXXXXX
- notes: Web site URL = https://moa-coffee.ir/
- related_supplier: Supplier(id=1, name=`Moa Coffee`)
