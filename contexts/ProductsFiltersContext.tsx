import React, { createContext, useContext, useMemo, useState } from 'react';

export type ProductsSortField = 'name' | 'category' | 'price';
export type ProductsSortDirection = 'asc' | 'desc';

type ProductsFiltersContextValue = {
    activeCategories: string[];
    setActiveCategories: React.Dispatch<React.SetStateAction<string[]>>;

    sortField: ProductsSortField;
    setSortField: React.Dispatch<React.SetStateAction<ProductsSortField>>;
    sortDirection: ProductsSortDirection;
    setSortDirection: React.Dispatch<React.SetStateAction<ProductsSortDirection>>;
};

const ProductsFiltersContext = createContext<ProductsFiltersContextValue | null>(null);

export function ProductsFiltersProvider({ children }: { children: React.ReactNode }) {
    const [activeCategories, setActiveCategories] = useState<string[]>([]);
    const [sortField, setSortField] = useState<ProductsSortField>('name');
    const [sortDirection, setSortDirection] = useState<ProductsSortDirection>('asc');

    const value = useMemo(
        () => ({
            activeCategories,
            setActiveCategories,
            sortField,
            setSortField,
            sortDirection,
            setSortDirection,
        }),
        [activeCategories, sortField, sortDirection]
    );

    return <ProductsFiltersContext.Provider value={value}>{children}</ProductsFiltersContext.Provider>;
}

export function useProductsFilters() {
    const ctx = useContext(ProductsFiltersContext);
    if (!ctx) {
        throw new Error('useProductsFilters deve ser usado dentro de ProductsFiltersProvider');
    }
    return ctx;
}
