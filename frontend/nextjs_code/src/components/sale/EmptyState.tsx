import { NewSaleButton } from './NewSaleButton';

export function EmptyState() {
  return (
    <div className="text-center py-12 flex flex-col gap-6">
      <div className="text-6xl opacity-70">☕</div>
      <p className="text-gray-400 text-lg">
        هیچ فروش فعالی وجود ندارد
      </p>
      <NewSaleButton />
    </div>
  );
}
