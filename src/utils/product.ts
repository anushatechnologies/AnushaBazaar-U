const asCleanString = (value?: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const looksLikeCompositeLabel = (value: string) => /\d/.test(value) || /\s/.test(value);

export const formatProductPack = (quantity?: unknown, unit?: unknown) => {
  const quantityText = asCleanString(quantity);
  const unitText = asCleanString(unit);

  if (quantityText && unitText) {
    const quantityLower = quantityText.toLowerCase();
    const unitLower = unitText.toLowerCase();

    if (quantityLower.includes(unitLower)) {
      return quantityText;
    }

    if (looksLikeCompositeLabel(unitText)) {
      return unitText;
    }

    return `${quantityText} ${unitText}`.trim();
  }

  if (unitText) return unitText;
  if (quantityText) return quantityText;

  return "";
};

export const getProductPackLabel = (item?: Record<string, any>, fallback?: Record<string, any>) => {
  const sources = [item, fallback].filter(Boolean);

  for (const source of sources) {
    const formatted = formatProductPack(
      source?.quantity ?? source?.qty ?? source?.packQuantity ?? source?.netQuantity,
      source?.unit ??
        source?.unitName ??
        source?.quantityUnit ??
        source?.uom ??
        source?.packSize ??
        source?.sizeName ??
        source?.weight ??
        source?.volume
    );

    if (formatted) return formatted;
  }

  return "";
};
export const isItemOutOfStock = (item: any): boolean => {
  if (!item) return false;

  // 1. Explicit stock count check
  // Covers: stock: 0, stock: "0"
  if (item.stock != null) {
    const s = Number(item.stock);
    if (!isNaN(s) && s <= 0) return true;
  }

  // 2. Boolean availability flags
  // Covers: available: false, active: false, isActive: false
  if (item.available === false) return true;
  if (item.active === false) return true;
  if (item.isActive === false) return true;

  // 3. Explicit "Out of Stock" flags
  // Covers: outOfStock: true
  if (item.outOfStock === true) return true;

  // 4. Status-based check
  // Covers: status: "OUT_OF_STOCK", status: "outofstock"
  if (typeof item.status === "string") {
    const s = item.status.trim().toUpperCase();
    if (s === "OUT_OF_STOCK" || s === "OUTOFSTOCK" || s === "INACTIVE" || s === "DISABLED") {
      return true;
    }
  }

  return false;
};
