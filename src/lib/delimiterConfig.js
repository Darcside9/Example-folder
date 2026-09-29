// ==========================================================================
// CHRIS SHOPPER — CREDENTIAL DELIMITER & SCHEMA CONFIGURATION ENGINE
// Manages platform-specific delimiters (|, :, ;, etc.) and credential schemas.
// ==========================================================================

export const STANDARD_FIELDS = [
  { key: 'username', label: 'Username', placeholder: 'johndoe_acc' },
  { key: 'password', label: 'Password', placeholder: 'P@ssw0rd123' },
  { key: 'twoFactorKey', label: '2FA Secret Key', placeholder: 'JBSWY3DPEHPK3PXP' },
  { key: 'mail', label: 'Email Address', placeholder: 'user@example.com' },
  { key: 'mailPassword', label: 'Email Password', placeholder: 'MailP@ss456' },
  { key: 'phone', label: 'Phone Number', placeholder: '+12025550192' },
  { key: 'token', label: 'Auth Token / Cookie', placeholder: 'eyJhbGciOiJIUzI1Ni...' },
  { key: 'pin', label: 'Security PIN', placeholder: '8492' },
  { key: 'notes', label: 'Notes / Extra Info', placeholder: 'Created 2021 | Clean IP' },
];

export const SUGGESTED_CUSTOM_FIELDS = [
  { key: 'recovery_email', label: 'Recovery Email', placeholder: 'recovery@example.com' },
  { key: 'backup_codes', label: 'Backup Codes', placeholder: '8492-3841-9281' },
  { key: 'cookie_json', label: 'Cookie / Session JSON', placeholder: '{"c_user":"1000..."}' },
  { key: 'profile_url', label: 'Profile URL', placeholder: 'https://site.com/profile/123' },
  { key: 'proxy', label: 'Proxy (IP:Port)', placeholder: '192.168.1.1:8080:usr:pwd' },
  { key: 'dob', label: 'Date of Birth', placeholder: '1995-08-14' },
  { key: 'secret_answer', label: 'Security Q&A', placeholder: 'Pet: Max' },
];

export const DELIMITER_PRESETS = [
  {
    id: 'standard_5_part',
    name: 'Standard 5-Segment (Pipe)',
    description: 'username | password | 2fa key | mail | mail password',
    delimiter: '|',
    fields: ['username', 'password', 'twoFactorKey', 'mail', 'mailPassword'],
  },
  {
    id: 'email_pass_colon',
    name: 'Email & Password (Colon)',
    description: 'email:password',
    delimiter: ':',
    fields: ['mail', 'password'],
  },
  {
    id: 'email_pass_pipe',
    name: 'Email & Password (Pipe)',
    description: 'email | password',
    delimiter: '|',
    fields: ['mail', 'password'],
  },
  {
    id: 'user_pass_colon',
    name: 'Username & Password (Colon)',
    description: 'username:password',
    delimiter: ':',
    fields: ['username', 'password'],
  },
  {
    id: 'user_pass_pipe',
    name: 'Username & Password (Pipe)',
    description: 'username | password',
    delimiter: '|',
    fields: ['username', 'password'],
  },
  {
    id: 'user_pass_2fa_pipe',
    name: 'Username, Password & 2FA (Pipe)',
    description: 'username | password | 2fa key',
    delimiter: '|',
    fields: ['username', 'password', 'twoFactorKey'],
  },
  {
    id: 'email_pass_2fa_pipe',
    name: 'Email, Password & 2FA (Pipe)',
    description: 'email | password | 2fa key',
    delimiter: '|',
    fields: ['mail', 'password', 'twoFactorKey'],
  },
  {
    id: 'full_mail_2fa_pipe',
    name: '4-Segment: Email, Pass, Mail Pass & 2FA (Pipe)',
    description: 'email | password | mail password | 2fa key',
    delimiter: '|',
    fields: ['mail', 'password', 'mailPassword', 'twoFactorKey'],
  },
];

export const DEFAULT_DELIMITER_CONFIG = {
  id: 'standard_5_part',
  name: 'Standard 5-Segment (Pipe)',
  delimiter: '|',
  fields: ['username', 'password', 'twoFactorKey', 'mail', 'mailPassword'],
  customFieldLabels: {},
};

export const COMMON_DELIMITERS = [
  { label: 'Pipe ( | )', value: '|' },
  { label: 'Colon ( : )', value: ':' },
  { label: 'Semicolon ( ; )', value: ';' },
  { label: 'Comma ( , )', value: ',' },
  { label: 'Slash ( / )', value: '/' },
  { label: 'Space ( [space] )', value: ' ' },
  { label: 'Tab ( \\t )', value: '\t' },
];

/**
 * Resolves the display label for a field key (standard or custom).
 */
export function getFieldLabel(key, config) {
  if (!key) return '';
  if (config && config.customFieldLabels && config.customFieldLabels[key]) {
    return config.customFieldLabels[key];
  }
  const std = STANDARD_FIELDS.find(f => f.key === key);
  if (std) return std.label;
  const sug = SUGGESTED_CUSTOM_FIELDS.find(f => f.key === key);
  if (sug) return sug.label;

  // Format fallback key e.g. "custom_backup_code" -> "Backup Code"
  return key
    .replace(/^custom_/, '')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Resolves a placeholder value for a field key.
 */
export function getFieldPlaceholder(key, config) {
  if (!key) return 'data';
  const std = STANDARD_FIELDS.find(f => f.key === key);
  if (std) return std.placeholder;
  const sug = SUGGESTED_CUSTOM_FIELDS.find(f => f.key === key);
  if (sug) return sug.placeholder;

  const label = getFieldLabel(key, config);
  return `<${label}>`;
}

/**
 * Resolves a platform's delimiter configuration from database or returns fallback default.
 */
export function getPlatformDelimiterConfig(platform) {
  if (!platform) return { ...DEFAULT_DELIMITER_CONFIG, customFieldLabels: {} };

  // If already parsed object
  if (platform.delimiterConfig && typeof platform.delimiterConfig === 'object') {
    return {
      delimiter: platform.delimiterConfig.delimiter || '|',
      fields: Array.isArray(platform.delimiterConfig.fields) && platform.delimiterConfig.fields.length > 0
        ? platform.delimiterConfig.fields
        : [...DEFAULT_DELIMITER_CONFIG.fields],
      name: platform.delimiterConfig.name || 'Custom Format',
      customFieldLabels: platform.delimiterConfig.customFieldLabels || {}
    };
  }

  // If stored as JSON string in delimiter_config
  if (platform.delimiter_config && typeof platform.delimiter_config === 'string') {
    try {
      const parsed = JSON.parse(platform.delimiter_config);
      if (parsed && parsed.delimiter && Array.isArray(parsed.fields)) {
        return {
          delimiter: parsed.delimiter,
          fields: parsed.fields,
          name: parsed.name || 'Custom Format',
          customFieldLabels: parsed.customFieldLabels || {}
        };
      }
    } catch {}
  }

  // Fallback to default 5-segment pipe format
  return { ...DEFAULT_DELIMITER_CONFIG, customFieldLabels: {} };
}

/**
 * Generates human-readable format description / syntax.
 * e.g. "email:password" or "username | password | 2fa key | mail | mail password"
 */
export function formatSchemaSyntax(config) {
  const cfg = config || DEFAULT_DELIMITER_CONFIG;
  const delim = (cfg.delimiter === ':' || cfg.delimiter === ',') 
    ? cfg.delimiter 
    : (cfg.delimiter === ' ' ? ' [SPACE] ' : ` ${cfg.delimiter} `);
  
  return cfg.fields.map(key => {
    return getFieldLabel(key, cfg).toLowerCase();
  }).join(delim);
}

/**
 * Generates a realistic sample line matching the platform's delimiter and field order.
 */
export function generateSampleLine(config) {
  const cfg = config || DEFAULT_DELIMITER_CONFIG;
  const delim = (cfg.delimiter === ':' || cfg.delimiter === ',')
    ? cfg.delimiter
    : (cfg.delimiter === ' ' ? ' ' : ` ${cfg.delimiter} `);

  return cfg.fields.map(key => {
    return getFieldPlaceholder(key, cfg);
  }).join(delim);
}

/**
 * Strict Parser: Parses a raw log line according to the platform's assigned schema.
 * Rejects lines that do not have the exact number of segments or are missing mandatory fields.
 */
export function parseLineWithSchema(line, config) {
  const cfg = config || DEFAULT_DELIMITER_CONFIG;
  const raw = (line || '').trim();

  if (!raw) {
    return {
      isValid: false,
      error: 'Empty line',
      extracted: {},
      parts: []
    };
  }

  const delimiter = cfg.delimiter;
  const expectedFieldCount = cfg.fields.length;
  
  // Split using delimiter
  const parts = raw.split(delimiter).map(p => p.trim());

  // Check part count
  if (parts.length !== expectedFieldCount) {
    const syntax = formatSchemaSyntax(cfg);
    return {
      isValid: false,
      error: `Format mismatch: Expected ${expectedFieldCount} parts separated by '${delimiter}' (${syntax}), but found ${parts.length} parts.`,
      extracted: {},
      parts,
      raw
    };
  }

  // Check for empty fields
  const emptyIndices = [];
  parts.forEach((p, idx) => {
    if (!p || p.length === 0) emptyIndices.push(idx);
  });

  if (emptyIndices.length > 0) {
    const missingFieldLabels = emptyIndices.map(idx => {
      const fieldKey = cfg.fields[idx];
      return getFieldLabel(fieldKey, cfg);
    });
    return {
      isValid: false,
      error: `Missing required value for: ${missingFieldLabels.join(', ')}`,
      extracted: {},
      parts,
      raw
    };
  }

  // Map parts into extracted object
  const extracted = {};
  cfg.fields.forEach((fieldKey, idx) => {
    extracted[fieldKey] = parts[idx];
  });

  // Provide unified identity fallback (username || mail)
  if (!extracted.username && extracted.mail) {
    extracted.username = extracted.mail;
  }
  if (!extracted.mail && extracted.username && extracted.username.includes('@')) {
    extracted.mail = extracted.username;
  }

  return {
    isValid: true,
    error: null,
    extracted,
    parts,
    raw
  };
}
