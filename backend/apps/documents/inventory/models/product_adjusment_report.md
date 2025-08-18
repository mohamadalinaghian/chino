# Product Adjustment Report

## Purpose

If any adjustment reported by human, this model will store it.

---

## Fields

- product
- adjustment_report_date
- movement_type
- previous_quantity
- adjustment_quantity
- staff

---

## Relations

- product => Product (One To Many)

---

## Indexes

- product
- adjustment_report_date
- staff
- adjustment_report_date, staff

---

## Example

After a personnel report some product get reduced

- product: Product(id=33, name=`milk`)
- adjustment_report_date: 1404/02/15
- movement_type: MOVEMENTTYPE.REDUCE
- previous_quantity: Decimal('300')
- adjustment_quantity: Decimal('50')
- staff: User(id=1, name=`Mohamad Alinaghian`)
