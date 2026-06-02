/**
 * Request validation schemas for CodeVault API
 * Provides schema validation for all endpoint inputs
 */

export const authSchemas = {
  signup: {
    required: ['email', 'password', 'name'],
    optional: ['rememberMe'],
    rules: {
      email: (val) => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          return 'Invalid email format';
        }
        return null;
      },
      password: (val) => {
        if (typeof val !== 'string' || val.length < 8) {
          return 'Password must be at least 8 characters';
        }
        return null;
      },
      name: (val) => {
        if (typeof val !== 'string' || val.trim().length === 0) {
          return 'Name is required';
        }
        if (val.length > 255) {
          return 'Name must not exceed 255 characters';
        }
        return null;
      },
      rememberMe: (val) => {
        if (typeof val !== 'boolean' && val !== undefined) {
          return 'rememberMe must be a boolean';
        }
        return null;
      },
    },
  },

  login: {
    required: ['email', 'password'],
    optional: ['rememberMe', 'twoFactorCode'],
    rules: {
      email: (val) => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          return 'Invalid email format';
        }
        return null;
      },
      password: (val) => {
        if (typeof val !== 'string' || val.length === 0) {
          return 'Password is required';
        }
        return null;
      },
      rememberMe: (val) => {
        if (typeof val !== 'boolean' && val !== undefined) {
          return 'rememberMe must be a boolean';
        }
        return null;
      },
      twoFactorCode: (val) => {
        if (val !== undefined && (!/^\d{6}$/.test(String(val)))) {
          return '2FA code must be 6 digits';
        }
        return null;
      },
    },
  },

  updateProfile: {
    required: [],
    optional: ['name', 'email'],
    rules: {
      name: (val) => {
        if (val !== undefined && val !== null) {
          if (typeof val !== 'string' || (val.trim().length === 0 && val.length > 0)) {
            return 'Name must be a non-empty string';
          }
          if (val.length > 255) {
            return 'Name must not exceed 255 characters';
          }
        }
        return null;
      },
      email: (val) => {
        if (val !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          return 'Invalid email format';
        }
        return null;
      },
    },
  },

  enableTwoFactor: {
    required: ['backupCodes'],
    optional: [],
    rules: {
      backupCodes: (val) => {
        if (!Array.isArray(val)) {
          return 'backupCodes must be an array';
        }
        if (val.length === 0) {
          return 'Must provide at least one backup code';
        }
        return null;
      },
    },
  },
};

export const snippetSchemas = {
  create: {
    required: ['title', 'code', 'language'],
    optional: ['description', 'visibility', 'teamId', 'tags'],
    rules: {
      title: (val) => {
        if (typeof val !== 'string' || val.trim().length === 0) {
          return 'Title is required';
        }
        if (val.length > 255) {
          return 'Title must not exceed 255 characters';
        }
        return null;
      },
      code: (val) => {
        if (typeof val !== 'string' || val.trim().length === 0) {
          return 'Code is required';
        }
        return null;
      },
      language: (val) => {
        if (typeof val !== 'string' || val.trim().length === 0) {
          return 'Language is required';
        }
        if (val.length > 50) {
          return 'Language must not exceed 50 characters';
        }
        return null;
      },
      description: (val) => {
        if (val !== undefined && (typeof val !== 'string' || val.length > 1000)) {
          return 'Description must not exceed 1000 characters';
        }
        return null;
      },
      visibility: (val) => {
        if (val !== undefined && !['PRIVATE', 'PUBLIC', 'TEAM'].includes(val)) {
          return 'Invalid visibility. Must be PRIVATE, PUBLIC, or TEAM';
        }
        return null;
      },
      teamId: (val) => {
        if (val !== undefined && typeof val !== 'string') {
          return 'teamId must be a string';
        }
        return null;
      },
      tags: (val) => {
        if (val !== undefined) {
          if (!Array.isArray(val)) {
            return 'tags must be an array';
          }
          if (val.some((tag) => typeof tag !== 'string' || tag.trim().length === 0)) {
            return 'All tags must be non-empty strings';
          }
        }
        return null;
      },
    },
  },

  update: {
    required: [],
    optional: ['title', 'code', 'language', 'description', 'visibility', 'teamId', 'tags'],
    rules: {
      title: (val) => {
        if (val !== undefined) {
          if (typeof val !== 'string' || val.trim().length === 0) {
            return 'Title must be a non-empty string';
          }
          if (val.length > 255) {
            return 'Title must not exceed 255 characters';
          }
        }
        return null;
      },
      code: (val) => {
        if (val !== undefined) {
          if (typeof val !== 'string' || val.trim().length === 0) {
            return 'Code must be a non-empty string';
          }
        }
        return null;
      },
      language: (val) => {
        if (val !== undefined) {
          if (typeof val !== 'string' || val.trim().length === 0) {
            return 'Language must be a non-empty string';
          }
          if (val.length > 50) {
            return 'Language must not exceed 50 characters';
          }
        }
        return null;
      },
      description: (val) => {
        if (val !== undefined && (typeof val !== 'string' || val.length > 1000)) {
          return 'Description must not exceed 1000 characters';
        }
        return null;
      },
      visibility: (val) => {
        if (val !== undefined && !['PRIVATE', 'PUBLIC', 'TEAM'].includes(val)) {
          return 'Invalid visibility. Must be PRIVATE, PUBLIC, or TEAM';
        }
        return null;
      },
      tags: (val) => {
        if (val !== undefined) {
          if (!Array.isArray(val)) {
            return 'tags must be an array';
          }
          if (val.some((tag) => typeof tag !== 'string' || tag.trim().length === 0)) {
            return 'All tags must be non-empty strings';
          }
        }
        return null;
      },
    },
  },

  comment: {
    required: ['content'],
    optional: [],
    rules: {
      content: (val) => {
        if (typeof val !== 'string' || val.trim().length === 0) {
          return 'Comment content is required';
        }
        if (val.length > 2000) {
          return 'Comment must not exceed 2000 characters';
        }
        return null;
      },
    },
  },
};

export const teamSchemas = {
  create: {
    required: ['name', 'slug'],
    optional: ['description'],
    rules: {
      name: (val) => {
        if (typeof val !== 'string' || val.trim().length === 0) {
          return 'Team name is required';
        }
        if (val.length > 255) {
          return 'Team name must not exceed 255 characters';
        }
        return null;
      },
      slug: (val) => {
        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(val)) {
          return 'Invalid slug. Use lowercase letters, numbers, and hyphens only';
        }
        if (val.length > 50) {
          return 'Slug must not exceed 50 characters';
        }
        return null;
      },
      description: (val) => {
        if (val !== undefined && (typeof val !== 'string' || val.length > 500)) {
          return 'Description must not exceed 500 characters';
        }
        return null;
      },
    },
  },

  update: {
    required: [],
    optional: ['name', 'description'],
    rules: {
      name: (val) => {
        if (val !== undefined) {
          if (typeof val !== 'string' || val.trim().length === 0) {
            return 'Team name must be a non-empty string';
          }
          if (val.length > 255) {
            return 'Team name must not exceed 255 characters';
          }
        }
        return null;
      },
      description: (val) => {
        if (val !== undefined && (typeof val !== 'string' || val.length > 500)) {
          return 'Description must not exceed 500 characters';
        }
        return null;
      },
    },
  },
};

export const paginationSchema = {
  optional: ['page', 'limit', 'sort', 'order'],
  rules: {
    page: (val) => {
      if (val !== undefined) {
        const page = parseInt(val, 10);
        if (isNaN(page) || page < 1) {
          return 'Page must be a positive integer';
        }
      }
      return null;
    },
    limit: (val) => {
      if (val !== undefined) {
        const limit = parseInt(val, 10);
        if (isNaN(limit) || limit < 1 || limit > 100) {
          return 'Limit must be between 1 and 100';
        }
      }
      return null;
    },
    sort: (val) => {
      if (val !== undefined && !['createdAt', 'updatedAt', 'title'].includes(val)) {
        return 'Invalid sort field';
      }
      return null;
    },
    order: (val) => {
      if (val !== undefined && !['asc', 'desc'].includes(val.toLowerCase())) {
        return 'Order must be asc or desc';
      }
      return null;
    },
  },
};

/**
 * Validate request body against a schema
 * @param {object} body - Request body to validate
 * @param {object} schema - Schema definition with required, optional, and rules
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validateSchema = (body, schema) => {
  const errors = [];

  // Check required fields
  for (const field of schema.required || []) {
    if (!(field in body) || body[field] === undefined || body[field] === null) {
      errors.push(`${field} is required`);
    }
  }

  // Validate all provided fields
  const allFields = [...(schema.required || []), ...(schema.optional || [])];
  for (const field of allFields) {
    if (field in body && body[field] !== undefined) {
      const rule = schema.rules?.[field];
      if (rule && typeof rule === 'function') {
        const error = rule(body[field]);
        if (error) {
          errors.push(error);
        }
      }
    }
  }

  // Check for unknown fields
  for (const field of Object.keys(body)) {
    if (!allFields.includes(field)) {
      errors.push(`Unknown field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
  };
};
