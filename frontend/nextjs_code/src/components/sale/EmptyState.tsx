import { NewSaleButton } from './NewSaleButton';

export function EmptyState() {
  return (
    <div className="text-center py-12 flex flex-col gap-4">
      <div className="text-4xl">☕</div>
      <p className="text-gray-500">
        هیچ فروش فعالی وجود ندارد
      </p>
      <NewSaleButton />
    </div>
  );
}
