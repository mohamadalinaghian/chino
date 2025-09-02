# Supplier Product Service

<!--toc:start-->

- [Supplier Product Service](#supplier-product-service)
  - [Check product exist in supplier's provided list](#check-product-exist-in-suppliers-provided-list) - [If not exist:](#if-not-exist)
  <!--toc:end-->

In this service we manage logic of updating `SupplierProduct`
model based on purchase item.

## Check product exist in supplier's provided list

- If supplier provided in invoice, first check to
  exists of item in supplier's provided list
  #### If not exist:
      - requset to user if wants add this item to supplier' provided list
      - rollback hole process to fix issue

## Update price

- We will update price of item for provided supplier
