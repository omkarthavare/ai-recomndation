import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles, Search, SlidersHorizontal, ArrowUpRight, Star, Zap,
  ShieldCheck, Heart, Smartphone, Laptop, Headphones, Watch,
  LoaderCircle, CheckCircle2, AlertCircle, RefreshCw, WandSparkles
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '');
const categories = ['All products', 'Phones', 'Laptops', 'Audio', 'Wearables'];
const categoryMap = { Phones: 'phone', Laptops: 'laptop', Audio: 'audio', Wearables: 'wearable' };
const iconMap = { phone: Smartphone, laptop: Laptop, audio: Headphones, wearable: Watch };
const prompts = [
  'I need a phone under $500 with a great camera',
  'Find me a laptop for coding under $1,000',
  'I want comfortable headphones for travel',
];

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function ProductCard({ product, recommendation, onToggle, selected }) {
  const Icon = iconMap[product.category] || Smartphone;
  return (
    <article className={`product-card ${recommendation ? 'recommended-card' : ''}`}>
      <div className={`product-art art-${product.category}`}>
        <span className="category-chip">{product.category}</span>
        <div className="device-orb"><Icon size={56} strokeWidth={1.35} /></div>
        <button className={`save-button ${selected ? 'is-saved' : ''}`} onClick={() => onToggle(product.id)} aria-label={selected ? 'Remove from shortlist' : 'Add to shortlist'}>
          <Heart size={17} fill={selected ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-content">
        <div className="product-brand">{product.brand}</div>
        <h3>{product.name}</h3>
        <div className="rating"><Star size={14} fill="currentColor" /> <strong>{product.rating.toFixed(1)}</strong><span>({product.reviews.toLocaleString()} reviews)</span></div>
        <p className="product-description">{product.description}</p>
        <div className="feature-list">{product.features.slice(0, 3).map((feature) => <span key={feature}>{feature}</span>)}</div>
        {recommendation && <div className="match-note"><CheckCircle2 size={15} /><span>{recommendation.reason}</span></div>}
        <div className="product-footer"><strong className="price">{money(product.price)}</strong><button className="details-button" onClick={() => window.alert(`${product.name}\n\n${product.description}\n\nFeatures: ${product.features.join(', ')}`)}>Details <ArrowUpRight size={15} /></button></div>
      </div>
    </article>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [preferences, setPreferences] = useState('');
  const [category, setCategory] = useState('All products');
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState('');
  const [mode, setMode] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shortlist, setShortlist] = useState([]);
  const [health, setHealth] = useState({ aiConfigured: false });

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`${API_BASE}/api/products`).then((r) => { if (!r.ok) throw new Error('Could not load products'); return r.json(); }),
      fetch(`${API_BASE}/api/health`).then((r) => r.ok ? r.json() : {}).catch(() => ({})),
    ]).then(([data, status]) => {
      if (!active) return;
      setProducts(data.products || []);
      setHealth(status);
    }).catch(() => {
      if (active) setError(`Can't reach the API at ${API_BASE}. Start the server with npm run dev.`);
    }).finally(() => active && setLoadingProducts(false));
    return () => { active = false; };
  }, []);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const categoryMatches = category === 'All products' || p.category === categoryMap[category];
      const searchMatches = !q || `${p.name} ${p.brand} ${p.description} ${p.features.join(' ')}`.toLowerCase().includes(q);
      return categoryMatches && searchMatches;
    });
  }, [products, category, query]);

  const recommendationMap = useMemo(() => new Map(recommendations.map((r) => [r.productId, r])), [recommendations]);
  const recommendationProducts = useMemo(() => recommendations.map((r) => {
    const product = products.find((p) => p.id === r.productId);
    return product ? { product, recommendation: r } : null;
  }).filter(Boolean), [recommendations, products]);

  async function getRecommendations(event) {
    event?.preventDefault();
    if (!preferences.trim()) { setError('Tell us what you are looking for first.'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE}/api/recommendations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: preferences.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Recommendations could not be generated.');
      setRecommendations(data.recommendations || []);
      setSummary(data.summary || '');
      setMode(data.mode || 'local');
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  }

  function toggleShortlist(id) {
    setShortlist((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]);
  }

  function resetRecommendations() {
    setRecommendations([]); setSummary(''); setMode(''); setError('');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-lockup" href="#" aria-label="Productly AI home"><span className="brand-mark"><Sparkles size={20} /></span><span>productly<span className="brand-ai">.ai</span></span></a>
        <nav className="top-nav"><a href="#catalog">Explore products</a><a href="#how-it-works">How it works</a></nav>
        <div className="top-actions"><span className="secure-label"><ShieldCheck size={15} /> Thoughtful picks, smarter buys</span><button className="shortlist-pill" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}><Heart size={15} /> Shortlist <b>{shortlist.length}</b></button></div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL SHOPPING ASSISTANT</div>
            <h1>Less scrolling.<br /><span>More finding your fit.</span></h1>
            <p className="hero-description">Tell us what matters to you. Our AI helps you discover the right products from a curated catalog, without the overwhelm.</p>
            <div className="hero-proof"><div className="proof-icon"><Zap size={17} /></div><div><strong>Recommendations that get you</strong><span>Based on your needs, budget, and priorities</span></div></div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-glow"></div><div className="floating-card floating-card-top"><span className="mini-sparkle"><Sparkles size={14} /></span><span>Made for your needs</span><CheckCircle2 size={16} className="floating-check" /></div>
            <div className="hero-device device-phone"><div className="phone-screen"><div className="phone-camera"></div><div className="phone-ui-line"></div><div className="phone-ui-line short"></div><div className="phone-photo"></div><div className="phone-bottom-line"></div></div></div>
            <div className="hero-device device-headphones"><Headphones size={68} strokeWidth={1.25} /></div>
            <div className="hero-device device-watch"><Watch size={43} strokeWidth={1.35} /></div>
            <div className="floating-card floating-card-bottom"><span className="match-circle">94</span><span><strong>Great match</strong><small>For your priorities</small></span></div>
            <div className="visual-sparkle sparkle-one">✳</div><div className="visual-sparkle sparkle-two">✦</div>
          </div>
        </section>

        <section className="recommendation-section" aria-labelledby="recommend-heading">
          <div className="section-heading"><div><div className="section-kicker">LET'S FIND YOUR MATCH</div><h2 id="recommend-heading">What are you looking for?</h2></div><div className="ai-status"><span className={`status-dot ${health.aiConfigured ? 'status-ai' : ''}`} />{health.aiConfigured ? 'AI recommendations enabled' : 'Smart recommendations ready'}</div></div>
          <form className="prompt-panel" onSubmit={getRecommendations}>
            <div className="prompt-label"><span className="prompt-icon"><WandSparkles size={17} /></span><label htmlFor="preferences">Describe your ideal product</label><span className="optional-label">Be as specific as you like</span></div>
            <textarea id="preferences" value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="e.g. I need a phone under $500 with a great camera and all-day battery..." rows={3} maxLength={1000} />
            <div className="prompt-bottom"><div className="prompt-examples"><span>Try:</span>{prompts.map((p) => <button type="button" key={p} onClick={() => setPreferences(p)}>{p}</button>)}</div><button className="recommend-button" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> Finding matches...</> : <><Sparkles size={17} /> Find my match <ArrowUpRight size={16} /></>}</button></div>
            {error && <div className="inline-error" role="alert"><AlertCircle size={16} />{error}</div>}
          </form>
        </section>

        {recommendationProducts.length > 0 && <section className="results-section" aria-live="polite">
          <div className="results-heading"><div><div className="section-kicker">YOUR PERSONALIZED PICKS</div><h2>We found your match<span className="result-count">{recommendationProducts.length}</span></h2></div><button className="text-button" onClick={resetRecommendations}><RefreshCw size={15} /> Start over</button></div>
          {summary && <div className="summary-banner"><span className="summary-spark"><Sparkles size={17} /></span><div><strong>{mode === 'ai' ? 'AI-powered insight' : 'Smart match insight'}</strong><p>{summary}</p></div><span className="mode-pill">{mode === 'ai' ? 'AI' : 'SMART'}</span></div>}
          <div className="product-grid">{recommendationProducts.map(({ product, recommendation }) => <ProductCard key={product.id} product={product} recommendation={recommendation} selected={shortlist.includes(product.id)} onToggle={toggleShortlist} />)}</div>
        </section>}

        <section className="catalog-section" id="catalog">
          <div className="catalog-heading"><div><div className="section-kicker">THE CURATED COLLECTION</div><h2>{recommendationProducts.length ? 'Explore more products' : 'Find something you’ll love'}</h2><p>Quality picks across categories, all in one place.</p></div><div className="catalog-count">{visibleProducts.length} products <span>to explore</span></div></div>
          <div className="catalog-controls"><div className="category-tabs" role="tablist" aria-label="Product categories">{categories.map((c) => <button key={c} role="tab" aria-selected={category === c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><label className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." aria-label="Search products" /><SlidersHorizontal size={16} /></label></div>
          {loadingProducts ? <div className="loading-state"><LoaderCircle className="spin" size={24} /> Loading curated products...</div> : visibleProducts.length ? <div className="product-grid">{visibleProducts.map((p) => <ProductCard key={p.id} product={p} recommendation={recommendationMap.get(p.id)} selected={shortlist.includes(p.id)} onToggle={toggleShortlist} />)}</div> : <div className="empty-state"><Search size={25} /><strong>No products found</strong><span>Try a different search or category.</span><button className="text-button" onClick={() => { setQuery(''); setCategory('All products'); }}>Clear filters</button></div>}
        </section>

        <section className="how-section" id="how-it-works"><div className="section-kicker">SIMPLE BY DESIGN</div><h2>A better way to choose.</h2><div className="steps-grid"><div className="step"><span className="step-number">01</span><div className="step-icon"><WandSparkles size={22} /></div><h3>Tell us what matters</h3><p>Share your budget, how you’ll use it, and the features you care about.</p></div><div className="step"><span className="step-number">02</span><div className="step-icon"><Sparkles size={22} /></div><h3>Get tailored picks</h3><p>Our recommendation engine matches your preferences to real items in the catalog.</p></div><div className="step"><span className="step-number">03</span><div className="step-icon"><Heart size={22} /></div><h3>Choose with confidence</h3><p>Compare options, understand why they fit, and save your favorites.</p></div></div></section>
      </main>
      <footer className="footer"><a className="brand-lockup" href="#"><span className="brand-mark"><Sparkles size={17} /></span><span>productly<span className="brand-ai">.ai</span></span></a><span>Better choices start with what matters to you.</span><span className="footer-right">Built with care <span>✳</span></span></footer>
    </div>
  );
}
