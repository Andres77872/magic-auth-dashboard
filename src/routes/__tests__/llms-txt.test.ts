import { describe, expect, it } from 'vitest';
import llmsTxt from '../../../public/llms.txt?raw';
import { NAVIGATION_ITEMS, ROUTES } from '@/utils/routes';

/**
 * public/llms.txt (https://llmstxt.org) is served as-is at /llms.txt. These
 * checks keep it in the llms.txt shape and in step with the console's routes.
 */

const lines = llmsTxt.split('\n');
const sections = llmsTxt.split(/^## /m).slice(1);
const sectionNamed = (name: string): string =>
  sections.find((section) => section.startsWith(`${name}\n`)) ?? '';

/** Backticked console paths such as `/users/:userHash` or `/groups?tab=...`. */
const mentionedPaths = (text: string): string[] =>
  [...text.matchAll(/`(\/[^`\s]*)`/g)].map((match) => match[1]);

describe('public/llms.txt', () => {
  it('has one H1, a blockquote summary and the Optional section last', () => {
    expect(lines[0]).toBe('# Magic Auth Dashboard');
    expect(lines.filter((line) => line.startsWith('# '))).toHaveLength(1);
    expect(lines[1]).toBe('');
    expect(lines[2].startsWith('> ')).toBe(true);
    expect(sections.at(-1)?.startsWith('Optional\n')).toBe(true);
  });

  it('lists only described links in the Docs and Optional sections', () => {
    for (const name of ['Docs', 'Optional']) {
      const items = sectionNamed(name)
        .split('\n')
        .slice(1)
        .filter((line) => line.trim());
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)\s]+\): \S/);
      }
    }
  });

  it('uses absolute https links only', () => {
    for (const [, target] of llmsTxt.matchAll(/\]\(([^)\s]+)\)/g)) {
      expect(target).toMatch(/^https:\/\//);
    }
  });

  it('mentions only console routes that exist', () => {
    const known = new Set<string>(Object.values(ROUTES));
    const paths = [
      ...mentionedPaths(sectionNamed('Public pages and sign-in')),
      ...mentionedPaths(sectionNamed('Console areas')),
    ];

    expect(paths.length).toBeGreaterThan(20);
    for (const path of paths) {
      // `/users/:userHash` is checked by its static prefix, `/users`.
      const staticPath =
        path.split('?')[0].split('/:')[0].replace(/\/$/, '') || '/';
      expect(known, path).toContain(staticPath);
    }
  });

  it('describes every page in the sidebar', () => {
    const described = new Set(mentionedPaths(sectionNamed('Console areas')));
    for (const item of NAVIGATION_ITEMS) {
      expect(described, item.label).toContain(item.path);
    }
  });
});
