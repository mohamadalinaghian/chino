/**
 * Get icon for menu item based on name or category
 * Returns appropriate emoji for different food/drink types
 */
export function getItemIcon(itemName: string, categoryName?: string): string {
  const name = itemName.toLowerCase();
  const category = categoryName?.toLowerCase() || '';

  // Coffee & Tea
  if (name.includes('coffee') || name.includes('قهوه') || name.includes('کافی')) return '☕';
  if (name.includes('espresso') || name.includes('اسپرسو')) return '☕';
  if (name.includes('cappuccino') || name.includes('کاپوچینو')) return '☕';
  if (name.includes('latte') || name.includes('لاته')) return '🥛';
  if (name.includes('tea') || name.includes('چای')) return '🍵';
  if (name.includes('mocha') || name.includes('موکا')) return '🍫';

  // Cold Drinks
  if (name.includes('juice') || name.includes('آب') || name.includes('juice')) return '🧃';
  if (name.includes('smoothie') || name.includes('اسموتی')) return '🥤';
  if (name.includes('shake') || name.includes('شیک')) return '🥤';
  if (name.includes('ice') || name.includes('یخ') || name.includes('cold')) return '🧊';
  if (name.includes('soda') || name.includes('نوشابه')) return '🥤';

  // Pastries & Desserts
  if (name.includes('cake') || name.includes('کیک')) return '🍰';
  if (name.includes('cookie') || name.includes('کوکی') || name.includes('بیسکویت')) return '🍪';
  if (name.includes('donut') || name.includes('دونات')) return '🍩';
  if (name.includes('croissant') || name.includes('کروسان')) return '🥐';
  if (name.includes('muffin') || name.includes('مافین')) return '🧁';
  if (name.includes('brownie') || name.includes('براونی')) return '🍫';
  if (name.includes('pie') || name.includes('پای')) return '🥧';

  // Sandwiches & Savory
  if (name.includes('sandwich') || name.includes('ساندویچ')) return '🥪';
  if (name.includes('burger') || name.includes('برگر')) return '🍔';
  if (name.includes('pizza') || name.includes('پیتزا')) return '🍕';
  if (name.includes('pasta') || name.includes('پاستا')) return '🍝';
  if (name.includes('salad') || name.includes('سالاد')) return '🥗';
  if (name.includes('wrap') || name.includes('رپ')) return '🌯';

  // Breakfast
  if (name.includes('egg') || name.includes('تخم') || name.includes('omelet')) return '🍳';
  if (name.includes('pancake') || name.includes('پنکیک')) return '🥞';
  if (name.includes('waffle') || name.includes('وافل')) return '🧇';
  if (name.includes('toast') || name.includes('توست')) return '🍞';

  // Snacks
  if (name.includes('fries') || name.includes('سیب زمینی')) return '🍟';
  if (name.includes('nugget') || name.includes('ناگت')) return '🍗';
  if (name.includes('popcorn') || name.includes('پاپ کرن')) return '🍿';

  // Default by category
  if (category.includes('drink') || category.includes('نوشیدنی') || category.includes('bar')) {
    return '🥤';
  }
  if (category.includes('food') || category.includes('غذا')) {
    return '🍽️';
  }
  if (category.includes('dessert') || category.includes('دسر')) {
    return '🍰';
  }
  if (category.includes('breakfast') || category.includes('صبحانه')) {
    return '🍳';
  }

  // Final fallback
  return '🍽️';
}

/**
 * Get icon for category
 */
export function getCategoryIcon(categoryName: string, parentGroup?: string): string {
  const name = categoryName.toLowerCase();

  // Coffee & Hot Drinks
  if (name.includes('coffee') || name.includes('قهوه')) return '☕';
  if (name.includes('tea') || name.includes('چای')) return '🍵';
  if (name.includes('hot') || name.includes('گرم')) return '🔥';

  // Cold Drinks
  if (name.includes('cold') || name.includes('سرد') || name.includes('ice')) return '🧊';
  if (name.includes('juice') || name.includes('آب میوه')) return '🧃';
  if (name.includes('smoothie') || name.includes('اسموتی')) return '🥤';

  // Food
  if (name.includes('breakfast') || name.includes('صبحانه')) return '🍳';
  if (name.includes('lunch') || name.includes('ناهار')) return '🍱';
  if (name.includes('dinner') || name.includes('شام')) return '🍽️';
  if (name.includes('dessert') || name.includes('دسر')) return '🍰';
  if (name.includes('snack') || name.includes('تنقلات')) return '🍿';
  if (name.includes('sandwich') || name.includes('ساندویچ')) return '🥪';
  if (name.includes('pasta') || name.includes('پاستا')) return '🍝';
  if (name.includes('pizza') || name.includes('پیتزا')) return '🍕';

  // By parent group
  if (parentGroup === 'BAR_ITEM') return '🍹';
  if (parentGroup === 'FOOD') return '🍽️';

  return '📋';
}
