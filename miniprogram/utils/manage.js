function normalizeName(name) {
  return String(name || '').trim();
}

function makeId(prefix, name) {
  const encoded = encodeURIComponent(name)
    .replace(/%/g, '')
    .slice(0, 24)
    .toLowerCase();
  return `${prefix}_${encoded || Date.now()}`;
}

function uniqueAppend(items, value) {
  const name = normalizeName(value);
  if (!name || (items || []).includes(name)) {
    return items || [];
  }
  return (items || []).concat(name);
}

function addCategory(categories, input) {
  const name = normalizeName(input && input.name);
  const type = input && input.type === 'income' ? 'income' : 'expense';
  if (!name) return categories || [];

  const exists = (categories || []).some((category) => category.name === name && category.type === type);
  if (exists) return categories || [];

  return (categories || []).concat({
    id: (input && input.id) || makeId(`category_${type}`, name),
    name,
    icon: (input && normalizeName(input.icon)) || '🌿',
    color: (input && normalizeName(input.color)) || '#79A86D',
    type
  });
}

function addAccount(accounts, name) {
  return uniqueAppend(accounts, name);
}

function addTag(tags, name) {
  return uniqueAppend(tags, name);
}

function buildTagOptions(tags, records) {
  const seen = new Set();
  const options = [];

  (tags || []).forEach((tag) => {
    const name = normalizeName(tag);
    if (name && !seen.has(name)) {
      seen.add(name);
      options.push(name);
    }
  });

  (records || []).forEach((record) => {
    (record.tags || []).forEach((tag) => {
      const name = normalizeName(tag);
      if (name && !seen.has(name)) {
        seen.add(name);
        options.push(name);
      }
    });
  });

  return options;
}

module.exports = {
  addAccount,
  addCategory,
  addTag,
  buildTagOptions
};
