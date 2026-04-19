import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Clock, Search, TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const CATEGORIES = [
  { id: 'autonomos', label: 'Para autónomos' },
  { id: 'clientes', label: 'Para clientes' },
  { id: 'legal_fiscal', label: 'Legal y fiscal' },
  { id: 'herramientas', label: 'Herramientas' },
  { id: 'actualidad', label: 'Actualidad' }
];

export function CategoryBadge({ category }) {
  const cat = {
    autonomos: { label: 'Para autónomos', cls: 'bg-blue-50 text-blue-700' },
    clientes: { label: 'Para clientes', cls: 'bg-green-50 text-green-700' },
    legal_fiscal: { label: 'Legal y fiscal', cls: 'bg-purple-50 text-purple-700' },
    herramientas: { label: 'Herramientas', cls: 'bg-amber-50 text-amber-700' },
    actualidad: { label: 'Actualidad', cls: 'bg-red-50 text-red-700' }
  }[category] || { label: category, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${cat.cls}`}>{cat.label}</span>;
}

function formatDate(dateStr, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Date(dateStr).toLocaleDateString('es-ES', opts);
}

export default function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BlogPost.filter({ status: 'published' }, '-publish_date', 100)
      .then(all => { setPosts(all); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p => {
    if (category !== 'all' && p.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (p.title_es || '').toLowerCase().includes(q) || (p.excerpt_es || '').toLowerCase().includes(q);
    }
    return true;
  });

  const featured = posts.find(p => p.featured);
  const rest = filtered.filter(p => p.id !== featured?.id);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Blog MisAutónomos — Consejos para autónomos en España</title>
        <meta name="description" content="Guías fiscales, herramientas y consejos prácticos para autónomos y clientes en España." />
        <link rel="canonical" href="https://misautonomos.es/blog" />
      </Helmet>

      {/* Hero */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Blog MisAutónomos</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">Consejos prácticos, guías fiscales y herramientas para autónomos y clientes en España.</p>
          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar artículos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${category === 'all' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              Todos
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${category === c.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-100 rounded-xl" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mt-4" />
                <div className="h-3 bg-gray-100 rounded w-full mt-2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No hay artículos que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && category === 'all' && !search && (
              <Link to={`/blog/${featured.slug}`} className="block mb-10 group">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100">
                    {featured.featured_image && (
                      <img src={featured.featured_image} alt={featured.title_es} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryBadge category={featured.category} />
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <TrendingUp className="w-3 h-3" /> Destacado
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">{featured.title_es}</h2>
                    <p className="text-gray-600 mt-2 line-clamp-3">{featured.excerpt_es}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-4">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.read_time_minutes} min</span>
                      <span>·</span>
                      <span>{featured.publish_date && formatDate(featured.publish_date)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
                    {post.featured_image ? (
                      <img src={post.featured_image} alt={post.title_es} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-3xl">📝</div>
                    )}
                  </div>
                  <CategoryBadge category={post.category} />
                  <h3 className="text-base font-semibold text-gray-900 mt-2 group-hover:text-gray-700 line-clamp-2">{post.title_es}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.excerpt_es}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time_minutes} min</span>
                    <span>·</span>
                    <span>{post.publish_date && formatDate(post.publish_date, { day: 'numeric', month: 'short' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}