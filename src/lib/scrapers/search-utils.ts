import { ProductResult } from "@/types";

/**
 * Match a query against a product using word-based matching.
 * Each word in the query is checked independently against the product's
 * name, brand, and category. A product matches if enough words hit.
 */
export function matchesQuery(product: ProductResult, query: string): boolean {
  return scoreMatch(product, query) > 0;
}

/**
 * Score how well a product matches a query. Higher = better match.
 * Returns 0 if the product doesn't meet the minimum match threshold.
 *
 * Scoring:
 * - Each query word that exactly matches in name gets +10
 * - Each query word that exactly matches in brand gets +8
 * - Each query word that exactly matches in category gets +3
 * - Each query word that fuzzy-matches gets half the above
 * - Bonus: all query words matched gets +20
 * - Bonus: query words appear consecutively in name gets +15
 */
export function scoreMatch(product: ProductResult, query: string): number {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;

  const name = (product.name || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const category = (product.category || "").toLowerCase();
  const nameWords = name.split(/\s+/);
  const brandWords = brand.split(/\s+/);
  const categoryWords = category.split(/\s+/);

  let score = 0;
  let matched = 0;

  for (const word of words) {
    let wordScore = 0;

    // Exact match in name (highest value)
    if (nameWords.some((nw) => nw === word)) {
      wordScore = 10;
    } else if (name.includes(word)) {
      wordScore = 8; // substring match in name
    }
    // Exact match in brand
    else if (brandWords.some((bw) => bw === word)) {
      wordScore = 8;
    }
    // Exact match in category
    else if (categoryWords.some((cw) => cw === word)) {
      wordScore = 3;
    }
    // Fuzzy match (typo tolerance)
    else {
      if (fuzzyWordMatch(word, nameWords)) {
        wordScore = 5;
      } else if (fuzzyWordMatch(word, brandWords)) {
        wordScore = 4;
      } else if (fuzzyWordMatch(word, categoryWords)) {
        wordScore = 1.5;
      }
    }

    if (wordScore > 0) {
      matched++;
      score += wordScore;
    }
  }

  // Require at least half the words to match, minimum 1
  const threshold = Math.max(1, Math.ceil(words.length * 0.5));
  if (matched < threshold) return 0;

  // Bonus: all query words matched
  if (matched === words.length) {
    score += 20;
  }

  // Bonus: full query appears as a consecutive phrase in name
  if (name.includes(words.join(" "))) {
    score += 15;
  }

  // Bonus: full query appears in brand + name combined
  const brandAndName = `${brand} ${name}`;
  if (brandAndName.includes(words.join(" "))) {
    score += 10;
  }

  return score;
}

/**
 * Simple fuzzy match: checks if any word in the word list is within
 * edit distance 2 of the query word (handles typos like "biunty" -> "bounty").
 */
function fuzzyWordMatch(queryWord: string, textWords: string[]): boolean {
  for (const textWord of textWords) {
    if (levenshtein(queryWord, textWord) <= 2) {
      return true;
    }
  }
  return false;
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}
