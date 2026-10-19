const STOP_WORDS = new Set(['i','want','need','looking','for','a','an','the','with','under','over','to','and','or','me','my','please','find','recommend','good','best','some','that','this','it','is','of','in','on','at','by','from','your','product','products']);

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9.$\s-]/g, ' ').split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word));
}

function extractBudget(text) {
  const normalized = text.toLowerCase().replace(/,/g, '');
  const patterns = [
    /(?:under|below|less than|max(?:imum)?(?: budget)?(?: of)?|up to|within)\s*\$?\s*(\d+(?:\.\d+)?)/,
    /\$\s*(\d+(?:\.\d+)?)\s*(?:or less|max(?:imum)?|budget)?/
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

export function recommendLocally(preferences, catalog, allowedIds) {
  const words = tokenize(preferences);
  const budget = extractBudget(preferences);
  const candidates = allowedIds ? catalog.filter((p) => allowedIds.includes(p.id)) : catalog;
  const ranked = candidates.map((product) => {
    const haystack = `${product.name} ${product.brand} ${product.category} ${product.description} ${product.features.join(' ')} ${product.tags.join(' ')}`.toLowerCase();
    let score = 0;
    const matched = [];
    for (const word of words) {
      if (haystack.includes(word)) {
        score += product.tags.some((tag) => tag.includes(word) || word.includes(tag)) ? 4 : 2;
        matched.push(word);
      }
    }
    if (budget !== null) score += product.price <= budget ? 8 : -Math.min(16, 6 + (product.price - budget) / 50);
    score += product.rating * 0.7;
    return { product, score, matched };
  });
  ranked.sort((a, b) => b.score - a.score || a.product.price - b.product.price);
  const best = ranked.slice(0, Math.min(3, ranked.length));
  const recommendations = best.map(({ product, score, matched }) => {
    let reason;
    if (budget !== null && product.price <= budget && matched.length) {
      reason = `Within your $${budget} budget, with relevant ${matched.slice(0, 2).join(' and ')} features.`;
    } else if (budget !== null && product.price <= budget) {
      reason = `Within your $${budget} budget, with a ${product.rating.toFixed(1)}-star customer rating.`;
    } else if (matched.length) {
      reason = `Matches your interest in ${matched.slice(0, 3).join(', ')}.`;
    } else {
      reason = `A highly rated option at ${product.rating.toFixed(1)} stars from this catalog.`;
    }
    return { productId: product.id, reason, matchScore: Math.max(55, Math.min(98, Math.round(68 + score * 1.3))) };
  });
  const summary = budget !== null
    ? `We prioritized options near or below $${budget} and ranked them by how closely their features match your request.`
    : `We ranked these options using the features and priorities in your request, plus customer ratings.`;
  return { summary, recommendations };
}
