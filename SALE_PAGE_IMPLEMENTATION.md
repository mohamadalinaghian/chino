# New Sale Page Implementation

## Overview
This document describes the implementation of the new sale page for the cafe management system. The page allows staff to create new sales orders with support for both dine-in and takeaway orders.

## Features

### 1. Sale Type Selection
- **Dine-in (سرو در محل)**: For customers eating at the cafe
- **Takeaway (بیرون بر)**: For customers taking food to go

### 2. Table Selection (Dine-in only)
- Visual table grid display
- Shows table capacity
- Only active tables are displayed
- Required when sale type is dine-in

### 3. Menu Navigation
- **Tabs**: Switch between Food (غذا) and Drinks (نوشیدنی)
- **Categories**: Horizontal scrolling category list with smooth auto-scroll to selected category
- **Items Grid**: Responsive grid layout showing menu items with images, descriptions, and prices

### 4. Item Management
- **Add to Cart**: Click on item to add
- **Extras Support**: Items with extras show a modal for selection
- **Quantity Control**: Adjust quantities in cart
- **Remove Items**: Remove items from cart

### 5. Cart Summary
- Real-time calculation of totals
- Persian money formatting (e.g., "1 میلیون و 500 هزار تومان")
- Scrollable cart items list
- Proceed to payment button

### 6. Extras Modal
- Lazy loading of extras when needed
- Quantity selection for each extra
- Real-time total calculation including extras
- Main item quantity selection

## Architecture

### Component Structure
```
/src/components/sale/
├── SaleTypeSelector/       # Sale type selection (Dine-in/Takeaway)
├── TableSelector/          # Table selection for dine-in
├── CategoryList/           # Category navigation with smooth scrolling
├── ItemCard/               # Individual menu item display
├── ItemsGrid/              # Grid layout for items
├── CartSummary/            # Cart display and management
└── ExtrasModal/            # Extras selection modal

/src/components/common/
├── Toast/                  # Toast notifications for feedback
└── LoadingOverlay/         # Loading state overlay
```

### Utilities
```
/src/utils/
└── persianUtils.ts         # Persian number formatting, Jalali dates

/src/service/
└── sale.ts                 # Sale-related API calls

/src/types/
└── sale.ts                 # TypeScript types for sale operations
```

### Constants
- **Catppuccin Mocha Colors**: Color palette defined in `/src/libs/constants.ts`

## Design System

### Colors (Catppuccin Mocha)
- **Background Primary**: `#1E1E2E` - Main background
- **Background Secondary**: `#181825` - Card backgrounds
- **Surface**: `#313244` - Interactive elements
- **Text**: `#CDD6F4` - Primary text
- **Subtext**: `#A6ADC8` - Secondary text
- **Accent**: `#CBA6F7` - Primary actions, selected states
- **Green**: `#A6E3A1` - Success, prices
- **Red**: `#F38BA8` - Errors, warnings
- **Blue**: `#89B4FA` - Info states
- **Yellow**: `#F9E2AF` - Warnings

### Responsive Design
- **Mobile First**: Grid layout adapts from 1 column on mobile to 4 columns on desktop
- **Table Selector**: Responsive grid (3 cols mobile → 6 cols desktop)
- **Category List**: Horizontal scrolling on all screen sizes
- **Cart**: Sticky on desktop, full-width on mobile

## Data Flow

### 1. Page Load
```
1. Fetch menu data from API (/api/menu/sale/menu)
2. Auto-select first category
3. Display items for selected category
```

### 2. Adding Items
```
1. User clicks on item
2. If item has extras:
   - Open extras modal
   - Fetch extras for item (lazy)
   - User selects extras and quantity
   - Add to cart with extras
3. If no extras:
   - Directly add to cart
4. Update cart totals
```

### 3. Creating Sale
```
1. Validate sale type and table (if dine-in)
2. Validate cart has items
3. Prepare sale data with items and extras
4. Call API to create sale
5. Show success toast
6. Redirect to payment page
```

## API Integration

### Endpoints Used
- `GET /api/menu/sale/menu` - Fetch menu grouped by category
- `GET /api/table/` - Fetch available tables
- `GET /api/menu/items/{id}/extras/` - Fetch extras for item (lazy)
- `POST /api/sale/open` - Create new sale

### Request Format (Create Sale)
```json
{
  "sale_type": "DINE_IN" | "TAKEAWAY",
  "table_id": number | null,
  "items": [
    {
      "menu_id": number,
      "quantity": number,
      "extras": [
        {
          "menu_id": number,
          "quantity": number
        }
      ]
    }
  ]
}
```

## Persian Localization

### Number Formatting
```typescript
formatPersianMoney(1) → "1 هزار تومان"
formatPersianMoney(342) → "342 هزار تومان"
formatPersianMoney(1547) → "1 میلیون و 547 هزار تومان"
formatPersianMoney(2000000) → "2 میلیارد تومان"
```

### Date Formatting
- Uses `jalali-moment` library
- Displays current date in Persian calendar
- Format: "جمعه، ۱۳ دی ۱۴۰۴"

## Error Handling

### User Feedback
- **Toast Notifications**: Non-intrusive notifications for success/error/warning
- **Inline Errors**: Error messages in components (table loading, menu loading)
- **Retry Options**: User can retry failed operations
- **Validation Messages**: Clear validation for required fields

### Error Scenarios
1. **Menu loading fails**: Show error with retry button
2. **Table loading fails**: Show error with retry button
3. **Extras loading fails**: Show error in modal with retry
4. **Sale creation fails**: Show error toast
5. **Validation errors**: Show warning toast
6. **Network errors**: Handled by authenticated fetch with auto-retry

## State Management

### Local State (useState)
- `saleType`: Current sale type (dine-in/takeaway)
- `selectedTableId`: Selected table ID
- `menuData`: Loaded menu data
- `selectedCategory`: Currently selected category
- `activeTab`: Active tab (bar/food)
- `cartItems`: Items in cart
- `extrasModalOpen`: Extras modal visibility
- `submitting`: Sale submission state

### Derived State (useMemo)
- `currentCategories`: Categories for active tab
- `currentItems`: Items for selected category

## Best Practices Implemented

### 1. SOLID Principles
- **Single Responsibility**: Each component has one clear purpose
- **Open/Closed**: Components are extensible through props
- **Dependency Inversion**: Components depend on abstractions (types/interfaces)

### 2. DRY (Don't Repeat Yourself)
- Reusable utility functions for formatting
- Shared color constants
- Component composition for repeated patterns

### 3. Performance
- **Lazy Loading**: Extras are fetched only when needed
- **Memoization**: Used for derived state calculations
- **Optimized Re-renders**: Strategic use of useMemo/useCallback

### 4. Accessibility
- Semantic HTML elements
- Clear button labels in Persian
- Visual feedback for interactions
- Keyboard navigation support

### 5. Code Organization
- One component per file
- Index files for clean imports
- Separate concerns (components, services, utilities, types)
- Clear naming conventions

## File Structure
```
frontend/nextjs_code/src/
├── app/
│   └── sale/
│       └── new/
│           └── page.tsx              # Main page component
├── components/
│   ├── sale/
│   │   ├── SaleTypeSelector/
│   │   ├── TableSelector/
│   │   ├── CategoryList/
│   │   ├── ItemCard/
│   │   ├── ItemsGrid/
│   │   ├── CartSummary/
│   │   └── ExtrasModal/
│   └── common/
│       ├── Toast/
│       └── LoadingOverlay/
├── libs/
│   └── constants.ts                  # App-wide constants
├── service/
│   └── sale.ts                       # Sale API service
├── types/
│   └── sale.ts                       # Sale-related types
└── utils/
    └── persianUtils.ts               # Persian formatting utilities
```

## Usage

### Accessing the Page
Navigate to: `/sale/new`

### Creating a Sale
1. Select sale type (Dine-in or Takeaway)
2. If dine-in, select a table
3. Switch between Food and Drinks tabs
4. Select a category
5. Click on items to add to cart
6. For items with extras, select extras and quantity in the modal
7. Review cart and adjust quantities as needed
8. Click "ادامه به پرداخت" (Proceed to Payment)
9. Sale is created and user is redirected to payment page

## Future Enhancements
- [ ] Discount application
- [ ] Tax calculation
- [ ] Guest management (link to customer)
- [ ] Notes for special instructions
- [ ] Saved carts/drafts
- [ ] Search functionality for items
- [ ] Barcode scanning support
- [ ] Split payment support
- [ ] Print receipt directly from sale page

## Testing Checklist
- [ ] Desktop: Chrome, Firefox, Safari
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Tablet: iPad, Android tablet
- [ ] RTL layout correctness
- [ ] Persian number display
- [ ] Jalali date display
- [ ] Error handling scenarios
- [ ] Network failure recovery
- [ ] Empty states
- [ ] Loading states
- [ ] Large cart (20+ items)
- [ ] Items with multiple extras
- [ ] Table selection validation
- [ ] Cart total calculations

## Dependencies
- `next` - Next.js framework
- `react` - React library
- `typescript` - Type safety
- `tailwindcss` - Styling
- `jalali-moment` - Persian date handling

## Notes
- All API calls use authenticated fetch with auto-refresh
- Colors can be customized by modifying `CATPPUCCIN_COLORS` in constants
- Money amounts are stored in thousands (e.g., 1 = 1000 Toman)
- RTL layout is handled automatically by `dir="rtl"` in HTML root
