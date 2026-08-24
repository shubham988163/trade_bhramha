/**
 * Single source of truth for brand identity.
 *
 * The previous name was scattered across a dozen files (header, sidebar,
 * landing page, FAQ copy, footer, page title, favicon). Everything now reads
 * from here, so renaming again means editing this file only.
 */

export const BRAND = {
  /** Full wordmark. */
  name: 'Trade_wid_SP',
  /** Wordmark split for two-tone rendering: `prefix` in ink, `accent` in colour. */
  namePrefix: 'Trade_wid_',
  nameAccent: 'SP',
  /** Monogram shown inside the logo tile. */
  monogram: 'SP',
  tagline: 'AI Market Pulse Scanner',
  pageTitle: 'Trade_wid_SP — AI Market Pulse & Professional Trading Dashboard',

  // Brand gradient — violet→cyan, distinct from the plain-blue mark it replaces.
  gradFrom: '#7c3aed',
  gradTo: '#22d3ee',

  // TODO: replace these placeholders with the real handles/addresses.
  telegram: 'https://t.me/tradewidsp',
  whatsapp: 'https://wa.me/919000000000',
  email: 'support@tradewidsp.com',
};
