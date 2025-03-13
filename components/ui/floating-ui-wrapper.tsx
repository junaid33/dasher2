"use client";

import { useState } from "react";
import { FloatingUI } from "./floating-ui";

interface FloatingUIWrapperProps {
  currentPage: number;
  total: number;
  pageSize: number;
  list: {
    singular: string;
    plural: string;
  };
}

export function FloatingUIWrapper({
  currentPage,
  total,
  pageSize,
  list,
}: FloatingUIWrapperProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleResetSelection = () => {
    setSelectedItems(new Set());
  };

  const handleDelete = () => {
    setSelectedItems(new Set());
  };

  return (
    <FloatingUI
      currentPage={currentPage}
      total={total}
      pageSize={pageSize}
      list={list}
      selectedItems={selectedItems}
      onResetSelection={handleResetSelection}
      onDelete={handleDelete}
    />
  );
} 