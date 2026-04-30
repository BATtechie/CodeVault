const VISIBILITIES = new Set(['PRIVATE', 'TEAM', 'PUBLIC']);

export const normalizeTags = (input) => {
  const rawTags = Array.isArray(input) ? input : String(input || '').split(',');

  return [...new Set(
    rawTags
      .map((tag) => String(tag).trim().toLowerCase())
      .filter(Boolean),
  )];
};

export const normalizeLanguage = (value) =>
  String(value || 'TEXT').trim().toUpperCase();

export const resolveVisibility = ({ visibility, isPublic, teamId }) => {
  const normalizedVisibility = String(visibility || '').trim().toUpperCase();

  if (VISIBILITIES.has(normalizedVisibility)) {
    return normalizedVisibility;
  }

  if (isPublic) {
    return 'PUBLIC';
  }

  if (teamId) {
    return 'TEAM';
  }

  return 'PRIVATE';
};

const getFieldValue = (value) => String(value || '').toLowerCase();

export const scoreSnippet = (snippet, query) => {
  const normalizedQuery = getFieldValue(query).trim();

  if (!normalizedQuery) {
    return 0;
  }

  const title = getFieldValue(snippet.title);
  const description = getFieldValue(snippet.description);
  const language = getFieldValue(snippet.language);
  const code = getFieldValue(snippet.code);
  const tags = (snippet.tags || []).map(getFieldValue);

  let score = 0;

  if (title === normalizedQuery) {
    score += 120;
  } else if (title.startsWith(normalizedQuery)) {
    score += 90;
  } else if (title.includes(normalizedQuery)) {
    score += 70;
  }

  if (tags.some((tag) => tag === normalizedQuery)) {
    score += 60;
  } else if (tags.some((tag) => tag.includes(normalizedQuery))) {
    score += 40;
  }

  if (language === normalizedQuery) {
    score += 35;
  } else if (language.includes(normalizedQuery)) {
    score += 20;
  }

  if (description.includes(normalizedQuery)) {
    score += 18;
  }

  if (code.includes(normalizedQuery)) {
    score += 10;
  }

  return score;
};

export const buildSnippetSearchWhere = (query) => {
  const normalizedQuery = String(query || '').trim();

  if (!normalizedQuery) {
    return undefined;
  }

  return {
    OR: [
      { title: { contains: normalizedQuery, mode: 'insensitive' } },
      { description: { contains: normalizedQuery, mode: 'insensitive' } },
      { code: { contains: normalizedQuery, mode: 'insensitive' } },
      { language: { contains: normalizedQuery, mode: 'insensitive' } },
      { tags: { has: normalizedQuery.toLowerCase() } },
    ],
  };
};

export const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
