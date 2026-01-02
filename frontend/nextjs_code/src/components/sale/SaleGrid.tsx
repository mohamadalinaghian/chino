import { SaleCard } from './SaleCard';

interface Props {
  sales: any[];
}

export function SaleGrid({ sales }: Props) {
  return (
    <div
      className="
        grid gap-2
        grid-cols-2
        sm:grid-cols-4
        md:grid-cols-5
        lg:grid-cols-6
        xl:grid-cols-8
      "
    >
      {sales.map((sale) => (
        <SaleCard key={sale.id} sale={sale} />
      ))}
    </div>
  );
}
