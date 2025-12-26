import { SaleCard } from './SaleCard';

interface Props {
  sales: any[];
}

export function SaleGrid({ sales }: Props) {
  return (
    <div
      className="
        grid gap-4
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
      "
    >
      {sales.map((sale) => (
        <SaleCard key={sale.id} sale={sale} />
      ))}
    </div>
  );
}
