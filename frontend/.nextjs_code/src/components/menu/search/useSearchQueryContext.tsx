"use client";

import { createContext, useContext } from "react";

export const SearchQueryContext = createContext<{ query: string }>({
  query: "",
});

export const useSearchQueryContext = () => useContext(SearchQueryContext);
