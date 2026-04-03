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
