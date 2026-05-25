const NON_VEG_KEYWORDS = ['non-veg', 'chicken', 'mutton', 'fish', 'meat', 'egg'];

const mapAttributeToken = token => {
  const value = String(token || '').trim();

  if (value === '1') {
    return 'veg';
  }

  if (value === '2') {
    return 'non-veg';
  }

  if (value === '24') {
    return 'egg';
  }

  return '';
};

const normalizeTypeToken = token => {
  const value = String(token || '').toLowerCase().trim();

  if (!value) {
    return '';
  }

  if (value === 'nonveg' || value === 'non veg') {
    return 'non-veg';
  }

  if (value === 'vegetarian') {
    return 'veg';
  }

  return value;
};

const pushToken = (set, token) => {
  const normalized = normalizeTypeToken(token);
  if (normalized) {
    set.add(normalized);
  }
};

export const getFoodTypeTokens = item => {
  const tokens = new Set();
  const safeItem = item || {};

  const typeSource =
    safeItem?.food?.type ??
    safeItem?.type ??
    safeItem?.rawPayload?.itemtype ??
    '';

  if (Array.isArray(typeSource)) {
    typeSource.forEach(token => pushToken(tokens, token));
  } else {
    String(typeSource)
      .split(',')
      .forEach(token => pushToken(tokens, token));
  }

  const attributeSources = [
    safeItem?.food?.attribute,
    safeItem?.food?.attributes,
    safeItem?.attribute,
    safeItem?.attributes,
    safeItem?.rawPayload?.item_attributeid,
    safeItem?.rawPayload?.item_attribute,
  ];

  attributeSources.forEach(source => {
    if (source === undefined || source === null) {
      return;
    }

    const sourceTokens = Array.isArray(source)
      ? source
      : String(source)
          .split(/[,\s]+/)
          .filter(Boolean);

    sourceTokens.forEach(token => {
      const mapped = mapAttributeToken(token);
      if (mapped) {
        tokens.add(mapped);
      }
    });
  });

  return Array.from(tokens);
};

export const getFoodTypeMeta = item => {
  const tokens = getFoodTypeTokens(item);

  const isVeg = tokens.includes('veg');
  const isNonVeg = tokens.some(token => NON_VEG_KEYWORDS.includes(token));

  return {
    isVeg,
    isNonVeg,
    label: isVeg ? 'Veg Special' : isNonVeg ? 'Non Veg Special' : 'Food Special',
    color: isVeg ? 'green' : isNonVeg ? 'red' : '#777',
  };
};

export const shouldIncludeByVegFilter = (item, isVegFilter) => {
  if (isVegFilter === null || isVegFilter === undefined) {
    return true;
  }

  const { isVeg, isNonVeg } = getFoodTypeMeta(item);

  if (isVegFilter === true) {
    return isVeg;
  }

  return isNonVeg;
};
