// components/products/FilterSidebar.tsx
'use client';

import {
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  useState,
  memo,
  type ChangeEvent,
  useRef,
} from 'react';
import { getCategories, getColors, getSizes, getBrands } from '@/services/api';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { FaArrowLeft } from 'react-icons/fa6';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ استيراد useCurrency

// ============================================================================
// Types
// ============================================================================

/** A single product category returned by the API */
export interface CategoryOption {
  id: number;
  name: string;
}

/** A single color option returned by the API */
export interface ColorOption {
  id: number;
  name: string;
  code: string;
}

/**  SizeOption مع ID و type */
export interface SizeOption {
  id: number;
  value: string;
  type?: 'ram' | 'hard-disk';
}

/** A single brand option returned by the API */
export interface BrandOption {
  id: number;
  name: string;
}

/** Shape of the filters object emitted to the parent via onFilterChange. */
export interface AppliedFilters {
  categoryIds?: number[];
  colors?: string[];
  attribute_values?: number[];
  brands?: number[];
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductFiltersProps {
  onFilterChange: (filters: AppliedFilters) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

type PriceRange = [number, number];

/** Internal selection state managed by the reducer. */
interface FiltersSelectionState {
  selectedCategories: number[];
  selectedColors: string[];
  selectedAttributeIds: number[];
  selectedBrands: number[];
  tempPriceRange: PriceRange;
  appliedPriceRange: PriceRange | undefined;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_PRICE = 0;
const MAX_PRICE = 100_000;
const DEFAULT_PRICE_RANGE: PriceRange = [10, 100000];

// Colors that need a different selection ring because they blend into a
// white background (kept as Sets for O(1) lookups and easy extension).
const WHITE_COLOR_CODES = new Set(['#FFFFFF', '#F9FAFB']);
const WHITE_COLOR_NAMES = new Set(['أبيض', 'white']);

const initialFiltersState: FiltersSelectionState = {
  selectedCategories: [],
  selectedColors: [],
  selectedAttributeIds: [],
  selectedBrands: [],
  tempPriceRange: DEFAULT_PRICE_RANGE,
  appliedPriceRange: undefined,
};

// ============================================================================
// Pure helpers
// ============================================================================

/** Adds or removes a value from an array — used by every checkbox toggle. */
function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** True if a color swatch should be treated as "white" for ring styling. */
function isWhiteColor(name: string, code: string): boolean {
  return WHITE_COLOR_NAMES.has(name) || WHITE_COLOR_CODES.has(code);
}

/**
 * Builds the filters object sent to the parent component.
 */
function buildAppliedFilters(state: FiltersSelectionState): AppliedFilters {
  const filters: AppliedFilters = {
    categoryIds: state.selectedCategories.length ? state.selectedCategories : undefined,
    colors: state.selectedColors.length ? state.selectedColors : undefined,
    attribute_values: state.selectedAttributeIds.length ? state.selectedAttributeIds : undefined,
    brands: state.selectedBrands.length ? state.selectedBrands : undefined,
  };

  if (state.appliedPriceRange) {
    filters.minPrice = state.appliedPriceRange[0];
    filters.maxPrice = state.appliedPriceRange[1];
  }

  return filters;
}

// ============================================================================
// Reducer
// ============================================================================

type FiltersAction =
  | { type: 'TOGGLE_CATEGORY'; payload: number }
  | { type: 'TOGGLE_COLOR'; payload: string }
  | { type: 'TOGGLE_ATTRIBUTE'; payload: number }
  | { type: 'TOGGLE_BRAND'; payload: number }
  | { type: 'SET_TEMP_PRICE_RANGE'; payload: PriceRange }
  | { type: 'APPLY_PRICE_FILTER' }
  | { type: 'RESET_ALL' }
  | { type: 'APPLY_ALL_FILTERS' };

function filtersReducer(state: FiltersSelectionState, action: FiltersAction): FiltersSelectionState {
  switch (action.type) {
    case 'TOGGLE_CATEGORY':
      return { ...state, selectedCategories: toggleInArray(state.selectedCategories, action.payload) };
    case 'TOGGLE_COLOR':
      return { ...state, selectedColors: toggleInArray(state.selectedColors, action.payload) };
    case 'TOGGLE_ATTRIBUTE':
      return { ...state, selectedAttributeIds: toggleInArray(state.selectedAttributeIds, action.payload) };
    case 'TOGGLE_BRAND':
      return { ...state, selectedBrands: toggleInArray(state.selectedBrands, action.payload) };
    case 'SET_TEMP_PRICE_RANGE':
      return { ...state, tempPriceRange: action.payload };
    case 'APPLY_PRICE_FILTER':
      return { ...state, appliedPriceRange: state.tempPriceRange };
    case 'APPLY_ALL_FILTERS':
      return { 
        ...state, 
        appliedPriceRange: state.tempPriceRange 
      };
    case 'RESET_ALL':
      return initialFiltersState;
    default:
      return state;
  }
}

// ============================================================================
// Data-loading hook
// ============================================================================

interface FilterOptionsState {
  categories: CategoryOption[];
  colors: ColorOption[];
  sizes: SizeOption[];
  brands: BrandOption[];
}

const EMPTY_FILTER_OPTIONS: FilterOptionsState = {
  categories: [],
  colors: [],
  sizes: [],
  brands: [],
};

function useFilterOptions(): FilterOptionsState {
  const [options, setOptions] = useState<FilterOptionsState>(EMPTY_FILTER_OPTIONS);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [categories, colors, sizes, brands] = await Promise.all([
          getCategories(),
          getColors(),
          getSizes(),
          getBrands(),
        ]);

        if (isMounted) {
          setOptions({ categories, colors, sizes, brands });
        }
      } catch (error) {
        console.error('Error loading filters data:', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return options;
}

// ============================================================================
// Components for "Show More" functionality
// ============================================================================

interface ShowMoreListProps<T, K extends string | number> {
  items: T[];
  selectedValues: K[];
  getKey: (item: T) => K;
  getLabel: (item: T) => string;
  onToggle: (key: K) => void;
  loadingMessage: string;
  getBadgeColor?: (item: T) => string;
  initialDisplayCount?: number;
  height?: string;
  showMoreText?: string;
  showLessText?: string;
  moreItemsText?: string;
}

function ShowMoreList<T, K extends string | number>({
  items,
  selectedValues,
  getKey,
  getLabel,
  onToggle,
  loadingMessage,
  getBadgeColor,
  initialDisplayCount = 4,
  height = 'h-[180px]',
  showMoreText = 'عرض المزيد',
  showLessText = 'عرض أقل',
  moreItemsText = 'عناصر أخرى',
}: ShowMoreListProps<T, K>) {
  const [showAll, setShowAll] = useState(false);
  
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">{loadingMessage}</p>;
  }

  const displayedItems = showAll ? items : items.slice(0, initialDisplayCount);
  const hasMore = items.length > initialDisplayCount;
  const hiddenCount = items.length - initialDisplayCount;

  return (
    <div className="space-y-2">
      <div 
        className={`${height} overflow-y-auto space-y-2  ps-1 custom-scrollbar`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#D1D5DB transparent',
        }}
      >
        {displayedItems.map((item) => {
          const key = getKey(item);
          const label = getLabel(item);
          const badgeColor = getBadgeColor?.(item);
          
          return (
            <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                checked={selectedValues.includes(key)}
                onChange={() => onToggle(key)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              {badgeColor && (
                <span 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: badgeColor }}
                />
              )}
              <span className="text-sm text-gray-600">{label}</span>
            </label>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-primary text-sm font-medium hover:underline mt-1 transition-all flex items-center gap-1"
        >
          {showAll ? (
            <>
              {showLessText}
              <ChevronUp size={16} />
            </>
          ) : (
            <>
              {showMoreText}
              <span className="text-gray-500 font-normal">
                + {hiddenCount} {moreItemsText}
              </span>
              <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Presentational sub-components
// ============================================================================

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-right font-semibold text-gray-700 mb-2"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  );
}

/**
 * Generic checkbox list used for categories, sizes, and brands.
 */
interface CheckboxFilterListProps<T, K extends string | number> {
  items: T[];
  selectedValues: K[];
  getKey: (item: T) => K;
  getLabel: (item: T) => string;
  onToggle: (key: K) => void;
  loadingMessage: string;
  maxHeightClassName?: string;
  getBadgeColor?: (item: T) => string;
  initialDisplayCount?: number;
  showMoreText?: string;
  showLessText?: string;
  moreItemsText?: string;
}

function CheckboxFilterListInner<T, K extends string | number>({
  items,
  selectedValues,
  getKey,
  getLabel,
  onToggle,
  loadingMessage,
  maxHeightClassName = 'max-h-64',
  getBadgeColor,
  initialDisplayCount = 4,
  showMoreText = 'عرض المزيد',
  showLessText = 'عرض أقل',
  moreItemsText = 'عناصر أخرى',
}: CheckboxFilterListProps<T, K>) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">{loadingMessage}</p>;
  }

  return (
    <ShowMoreList
      items={items}
      selectedValues={selectedValues}
      getKey={getKey}
      getLabel={getLabel}
      onToggle={onToggle}
      loadingMessage={loadingMessage}
      getBadgeColor={getBadgeColor}
      initialDisplayCount={initialDisplayCount}
      height="h-[180px]"
      showMoreText={showMoreText}
      showLessText={showLessText}
      moreItemsText={moreItemsText}
    />
  );
}

const CheckboxFilterList = memo(CheckboxFilterListInner) as typeof CheckboxFilterListInner;

/** Color swatch grid */
interface ColorSwatchListProps {
  colors: ColorOption[];
  selectedColors: string[];
  onToggle: (code: string) => void;
  loadingMessage: string;
  showMoreText?: string;
  showLessText?: string;
  moreItemsText?: string;
  initialDisplayCount?: number;
}

const ColorSwatchList = memo(function ColorSwatchList({
  colors,
  selectedColors,
  onToggle,
  loadingMessage,
  showMoreText = 'عرض المزيد',
  showLessText = 'عرض أقل',
  moreItemsText = 'عناصر أخرى',
  initialDisplayCount = 4,
}: ColorSwatchListProps) {
  const [showAll, setShowAll] = useState(false);

  if (colors.length === 0) {
    return <p className="text-sm text-gray-400">{loadingMessage}</p>;
  }

  const displayColors = showAll ? colors : colors.slice(0, initialDisplayCount);
  const hasMoreColors = colors.length > initialDisplayCount;
  const hiddenCount = colors.length - initialDisplayCount;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {displayColors.map((color) => {
          const isSelected = selectedColors.includes(color.code);
          const isWhite = isWhiteColor(color.name, color.code);

          return (
            <button
              key={color.id}
              onClick={() => onToggle(color.code)}
              className="group relative"
              aria-label={`Color ${color.name}`}
            >
              <div
                className={`
                  w-7 h-7 rounded-full transition-all duration-200 hover:scale-110
                  ${isSelected ? 'ring-2 ring-offset-2 scale-110' : ''}
                  ${isSelected && isWhite ? 'ring-black ring-offset-white' : isSelected ? 'ring-blue-500' : ''}
                `}
                style={{
                  backgroundColor: color.code,
                  ...(isWhite && { border: '1px solid #e5e7eb' }),
                }}
              />
            </button>
          );
        })}
      </div>

      {hasMoreColors && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-primary text-sm font-medium hover:underline mt-1 transition-all flex items-center gap-1"
        >
          {showAll ? (
            <>
              {showLessText}
              <ChevronUp size={16} />
            </>
          ) : (
            <>
              {showMoreText}
              <span className="text-gray-500 font-normal">
                + {hiddenCount} {moreItemsText}
              </span>
              <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
});

// ============================================================================
// Main component
// ============================================================================

export default function ProductFilters({ onFilterChange, isMobile = false, onClose }: ProductFiltersProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { currency, isLoading: currencyLoading } = useCurrency(); // ✅ استخدام العملة
  const [isClient, setIsClient] = useState(false);
  const onFilterChangeRef = useRef(onFilterChange);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  const [state, dispatch] = useReducer(filtersReducer, initialFiltersState);
  const { categories, colors, sizes, brands } = useFilterOptions();

  const [tempMinPrice, tempMaxPrice] = state.tempPriceRange;

  const showMoreText = t('filter.showMore');
  const showLessText = t('filter.showLess');
  const moreCategoriesText = t('filter.moreCategories');
  const moreBrandsText = t('filter.moreBrands');

  // ✅ استخدام العملة من الـ Hook بدلاً من الترجمة
  const currencySymbol = currencyLoading ? '...' : (currency || 'EGP');

  //  للديسكتوب: تطبيق الفلاتر فوراً عند التغيير (ما عدا السعر)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isMobile && onFilterChangeRef.current) {
      const filters = buildAppliedFilters(state);
      onFilterChangeRef.current(filters);
    }
  }, [
    state.selectedCategories,
    state.selectedColors,
    state.selectedAttributeIds,
    state.selectedBrands,
    state.appliedPriceRange,
    isMobile,
  ]);

  //  دالة تطبيق الفلاتر (للموبايل فقط)
  const applyFilters = useCallback(() => {
    dispatch({ type: 'APPLY_ALL_FILTERS' });
    
    const filtersToApply = buildAppliedFilters({
      ...state,
      appliedPriceRange: state.tempPriceRange,
    });
    onFilterChangeRef.current(filtersToApply);
    
    if (isMobile && onClose) {
      onClose();
    }
  }, [state, isMobile, onClose]);

  // ---- Instant filter toggles ----
  const handleCategoryToggle = useCallback((id: number) => {
    dispatch({ type: 'TOGGLE_CATEGORY', payload: id });
  }, []);

  const handleColorToggle = useCallback((code: string) => {
    dispatch({ type: 'TOGGLE_COLOR', payload: code });
  }, []);

  const handleAttributeToggle = useCallback((id: number) => {
    dispatch({ type: 'TOGGLE_ATTRIBUTE', payload: id });
  }, []);

  const handleBrandToggle = useCallback((id: number) => {
    dispatch({ type: 'TOGGLE_BRAND', payload: id });
  }, []);

  // ---- Price handlers ----
  const handlePriceSliderChange = useCallback((value: number[]) => {
    dispatch({ type: 'SET_TEMP_PRICE_RANGE', payload: [value[0], value[1]] });
  }, []);

  //  معالج السعر الأقصى - مستقل تماماً عن السعر الأقل
  const handleMaxPriceInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    //  إذا كان الحقل فارغاً، نضع قيمة 0 مؤقتاً
    if (value === '') {
      dispatch({ type: 'SET_TEMP_PRICE_RANGE', payload: [tempMinPrice, 0] });
      return;
    }
    
    const numValue = Number(value);
    //  نتحقق فقط من أن القيمة لا تتجاوز الحد الأقصى المسموح
    if (!isNaN(numValue) && numValue <= MAX_PRICE) {
      dispatch({ type: 'SET_TEMP_PRICE_RANGE', payload: [tempMinPrice, numValue] });
    }
  };

  //  معالج السعر الأقل - مستقل تماماً عن السعر الأقصى
  const handleMinPriceInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    //  إذا كان الحقل فارغاً، نضع قيمة 0 مؤقتاً
    if (value === '') {
      dispatch({ type: 'SET_TEMP_PRICE_RANGE', payload: [0, tempMaxPrice] });
      return;
    }
    
    const numValue = Number(value);
    //  نتحقق فقط من أن القيمة لا تقل عن الحد الأدنى المسموح
    if (!isNaN(numValue) && numValue >= MIN_PRICE) {
      dispatch({ type: 'SET_TEMP_PRICE_RANGE', payload: [numValue, tempMaxPrice] });
    }
  };

  //  زر تطبيق السعر
  const handleApplyPriceFilter = useCallback(() => {
    dispatch({ type: 'APPLY_PRICE_FILTER' });
    
    const filters = buildAppliedFilters({
      ...state,
      appliedPriceRange: state.tempPriceRange,
    });
    
    onFilterChangeRef.current(filters);
  }, [state]);

  const handleResetFilters = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
    onFilterChangeRef.current({});
    if (onClose && isMobile) onClose();
  }, [onClose, isMobile]);

  //  دالة للحصول على لون الخلفية حسب النوع
  const getSizeBadgeColor = (size: SizeOption): string => {
    if (size.type === 'ram') return '#3B82F6';
    if (size.type === 'hard-disk') return '#10B981';
    return '#9CA3AF';
  };

  const getSizeLabel = useCallback((size: SizeOption): string => {
    if (size.type === 'ram') return `${t('filter.ramPrefix')}${size.value}`;
    if (size.type === 'hard-disk') return `${t('filter.hddPrefix')}${size.value}`;
    return size.value;
  }, [t]);

  const getSelectedFiltersCount = useCallback(() => {
    let count = 0;
    if (state.selectedCategories.length) count += state.selectedCategories.length;
    if (state.selectedColors.length) count += state.selectedColors.length;
    if (state.selectedAttributeIds.length) count += state.selectedAttributeIds.length;
    if (state.selectedBrands.length) count += state.selectedBrands.length;
    if (state.appliedPriceRange && (state.appliedPriceRange[0] > MIN_PRICE || state.appliedPriceRange[1] < MAX_PRICE)) count++;
    return count;
  }, [state]);

  return (
    <>
      <div
        className={`
          border rounded-[8px] p-4
          ${
            isMobile
              ? 'w-full max-h-[calc(100vh-80px)] my-0 border-0 rounded-none'
              : 'sticky top-[10%] mx-auto my-3 w-[340px]'
          }
        `}
        suppressHydrationWarning
      >
        <h3 className="text-[18.28px] mb-4 text-[#180100] flex justify-between items-center">
          {t('filter.title')}
          <button
            onClick={handleResetFilters}
            className="text-sm text-[#666666] border py-[10px] px-[18px] rounded-full border-[#999999] font-normal"
          >
            {t('filter.clearAll')}
          </button>
        </h3>

        {/* ===== فلتر السعر ===== */}
        <FilterSection title={t('filter.prices')}>
          <div className="space-y-4">
            <p className="text-sm text-[#333333] flex justify-end gap-1">
              <span>{currencySymbol}</span>
              {tempMaxPrice.toLocaleString()}
              <span>-</span>
              <span>{currencySymbol}</span>
              {tempMinPrice.toLocaleString()}
            </p>

            <Slider
              value={state.tempPriceRange}
              onValueChange={handlePriceSliderChange}
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={10}
              className="my-6"
            />

            <div className="flex gap-3 mt-2 items-center">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">{t('filter.maxPrice')}</label>
                <input
                  type="number"
                  value={tempMaxPrice || '0'}
                  onChange={handleMaxPriceInputChange}
                  className="w-full px-3 py-2 border border-gray-3000 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="الحد الأقصى"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">{t('filter.minPrice')}</label>
                <input
                  type="number"
                  value={tempMinPrice || '0'}
                  onChange={handleMinPriceInputChange}
                  className="w-full px-3 py-2 border border-gray-3000 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="الحد الأدنى"
                />
              </div>
              {!isMobile && (
                <div className="mt-4">
                  <button
                    onClick={handleApplyPriceFilter}
                    className="w-[32.89px] bg-main text-white py-2 rounded-[8px] transition-colors font-semibold flex items-center justify-center gap-2 hover:bg-main-dark"
                  >
                    <FaArrowLeft 
                      className={`h-4 w-4 ${isClient && language === 'en' ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </FilterSection>

        {/* ===== فلتر الفئات ===== */}
        {categories.length > 0 && (
          <FilterSection title={t('filter.categories')}>
            <CheckboxFilterList
              items={categories}
              selectedValues={state.selectedCategories}
              getKey={(category) => category.id}
              getLabel={(category) => category.name}
              onToggle={handleCategoryToggle}
              loadingMessage={t('filter.loadingCategories')}
              initialDisplayCount={4}
              maxHeightClassName="h-[180px]"
              showMoreText={showMoreText}
              showLessText={showLessText}
              moreItemsText={moreCategoriesText}
            />
          </FilterSection>
        )}

        {/* ===== فلتر الألوان ===== */}
        {colors.length > 0 && (
          <FilterSection title={t('filter.colors')}>
            <ColorSwatchList
              colors={colors}
              selectedColors={state.selectedColors}
              onToggle={handleColorToggle}
              loadingMessage={t('filter.loadingColors')}
              showMoreText={showMoreText}
              showLessText={showLessText}
              moreItemsText={moreCategoriesText}
              initialDisplayCount={4}
            />
          </FilterSection>
        )}

        {/* ===== فلتر المواصفات (RAM / HDD) ===== */}
        {sizes.length > 0 && (
          <FilterSection title={t('filter.specifications')}>
            <CheckboxFilterList
              items={sizes}
              selectedValues={state.selectedAttributeIds}
              getKey={(size) => size.id}
              getLabel={getSizeLabel}
              onToggle={handleAttributeToggle}
              loadingMessage={t('filter.loadingSpecifications')}
              initialDisplayCount={4}
              maxHeightClassName="h-[180px]"
              getBadgeColor={getSizeBadgeColor}
              showMoreText={showMoreText}
              showLessText={showLessText}
              moreItemsText={moreCategoriesText}
            />
          </FilterSection>
        )}

        {/* ===== فلتر العلامات التجارية ===== */}
        {brands.length > 0 && (
          <FilterSection title={t('filter.brands')}>
            <CheckboxFilterList
              items={brands}
              selectedValues={state.selectedBrands}
              getKey={(brand) => brand.id}
              getLabel={(brand) => brand.name}
              onToggle={handleBrandToggle}
              loadingMessage={t('filter.loadingBrands')}
              initialDisplayCount={4}
              maxHeightClassName="h-[180px]"
              showMoreText={showMoreText}
              showLessText={showLessText}
              moreItemsText={moreBrandsText}
            />
          </FilterSection>
        )}

        {/*  زر تطبيق الفلاتر (يظهر فقط في الموبايل) */}
        {isMobile && (
          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-4 px-4 mt-4">
            <button
              onClick={applyFilters}
              className="w-full bg-main text-white py-3 rounded-[8px] font-semibold text-base transition-colors hover:bg-main-dark flex items-center justify-center gap-2"
            >
              {t('filter.apply')}
              {getSelectedFiltersCount() > 0 && (
                <span className="bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {getSelectedFiltersCount()}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
    </>
  );
}