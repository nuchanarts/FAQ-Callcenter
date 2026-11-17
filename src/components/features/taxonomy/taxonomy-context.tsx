"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_TAXONOMY, type Taxonomy } from "@/domain/taxonomy";

const TaxonomyContext = createContext<Taxonomy>(DEFAULT_TAXONOMY);

/** Current categories/levels for client components (provided once by the root layout). */
export function TaxonomyProvider({ value, children }: { value: Taxonomy; children: ReactNode }) {
  return <TaxonomyContext value={value}>{children}</TaxonomyContext>;
}

export function useTaxonomy(): Taxonomy {
  return useContext(TaxonomyContext);
}
