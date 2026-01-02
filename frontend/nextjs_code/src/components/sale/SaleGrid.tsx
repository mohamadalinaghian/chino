import { SaleCard } from './SaleCard';

interface Props {
  sales: any[];
}

export function SaleGrid({ sales }: Props) {
  return (
    <div
      className="
        grid gap-3
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        lg:grid-cols-5
        xl:grid-cols-6
      "
    >
      {sales.map((sale) => (
        <SaleCard key={sale.id} sale={sale} />
      ))}
    </div>
  );
}
