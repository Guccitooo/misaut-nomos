import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Eye } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CATEGORIES = [
  { id: 'autonomos', label: 'Para autónomos' },
  { id: 'clientes', label: 'Para clientes' },
  { id: 'legal_fiscal', label: 'Legal y fiscal' },
  { id: 'herramientas', label: 'Herramientas' },
  { id: 'actualidad', label: 'Actualidad' }
];

const generateSlug = (title) =>
  title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);

const calcReadTime = (htmlContent) => {
  const text = htmlContent?.replace(/<[^>]+>/g, '') || '';
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
};

const INITIAL = {
  title_es: '', title_en: '', slug: '', excerpt_es: '', excerpt_en: '',
  content_es: '', content_en: '', category: 'autonomos', tags: [],
  status: 'draft', featured: false, featured_image: '', og_image: '',
  author_name: 'Equipo MisAutónomos', author_avatar: '', author_bio: '',
  publish_date: new Date().toISOString().slice(0, 16), read_time_minutes: 5,
  meta_title_es: '', meta_description_es: '', related_articles: []
};

export default function BlogPostEditor({ post, allPosts, onSave, onCancel }) {
  const [data, setData] = useState(post ? { ...INITIAL, ...post } : INITIAL);
  const [tagInput, setTagInput] = useState((post?.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  const handleTitleChange = (val) => {
    set('title_es', val);
    if (!post?.slug) set('slug', generateSlug(val));
  };

  const handleContentChange = (val) => {
    set('content_es', val);
    set('read_time_minutes', calcReadTime(val));
  };

  const handleSave = async (status) => {
    setSaving(true);
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    // Auto-set to scheduled if publish_date is in the future
    let finalStatus = status || data.status;
    if (finalStatus === 'published' && data.publish_date && new Date(data.publish_date) > new Date()) {
      finalStatus = 'scheduled';
    }
    await onSave({ ...data, tags, status: finalStatus });
    setSaving(false);
  };

  const otherPosts = allPosts?.filter(p => p.id !== post?.id) || [];

  const TABS = ['content', 'meta', 'seo', 'author', 'publish', 'related'];
  const TAB_LABELS = { content: 'Contenido', meta: 'Metadatos', seo: 'SEO', author: 'Autor', publish: 'Publicación', related: 'Relacionados' };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={onCancel} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <h2 className="font-semibold text-gray-900 text-sm truncate flex-1 text-center">
            {post ? 'Editar artículo' : 'Nuevo artículo'}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={saving}>
              Guardar borrador
            </Button>
            {data.slug && data.status !== 'draft' && (
              <a href={`/blog/${data.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm"><Eye className="w-3.5 h-3.5 mr-1" /> Ver</Button>
              </a>
            )}
            <Button size="sm" className="bg-gray-900 hover:bg-gray-800" onClick={() => handleSave('published')} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Publicar'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <>
            <Field label="Título (ES) *">
              <input className="input-base" value={data.title_es} onChange={e => handleTitleChange(e.target.value)} placeholder="Título del artículo en español" />
            </Field>
            <Field label="Título (EN)">
              <input className="input-base" value={data.title_en || ''} onChange={e => set('title_en', e.target.value)} placeholder="Article title in English" />
            </Field>
            <Field label="Extracto (ES)">
              <textarea className="input-base resize-none" rows={3} value={data.excerpt_es || ''} onChange={e => set('excerpt_es', e.target.value)} placeholder="Breve descripción para SEO y listados (máx. 160 caracteres)" />
            </Field>
            <Field label="Contenido (ES) *">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={data.content_es}
                  onChange={handleContentChange}
                  style={{ minHeight: '400px' }}
                  modules={{
                    toolbar: [
                      [{ header: [2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      ['blockquote', 'code-block'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Tiempo de lectura estimado: ~{data.read_time_minutes} min</p>
            </Field>
          </>
        )}

        {/* META TAB */}
        {activeTab === 'meta' && (
          <>
            <Field label="Slug (URL) *">
              <div className="flex gap-2">
                <input className="input-base flex-1" value={data.slug} onChange={e => set('slug', e.target.value)} placeholder="mi-articulo-ejemplo" />
                <button type="button" onClick={() => set('slug', generateSlug(data.title_es))} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">misautonomos.es/blog/{data.slug}</p>
            </Field>
            <Field label="Categoría">
              <select className="input-base" value={data.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Tags (separados por coma)">
              <input className="input-base" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="autónomos, fiscal, irpf" />
            </Field>
            <Field label="Tiempo de lectura (minutos)">
              <input type="number" className="input-base w-24" min={1} max={60} value={data.read_time_minutes} onChange={e => set('read_time_minutes', parseInt(e.target.value))} />
            </Field>
          </>
        )}

        {/* SEO TAB */}
        {activeTab === 'seo' && (
          <>
            <Field label="Meta título">
              <input className="input-base" value={data.meta_title_es || ''} onChange={e => set('meta_title_es', e.target.value)} placeholder={`${data.title_es} | Blog MisAutónomos`} maxLength={70} />
              <p className="text-xs text-gray-400 mt-1">{(data.meta_title_es || '').length}/70 caracteres</p>
            </Field>
            <Field label="Meta descripción">
              <textarea className="input-base resize-none" rows={3} value={data.meta_description_es || ''} onChange={e => set('meta_description_es', e.target.value)} placeholder="Descripción para buscadores (máx. 160 caracteres)" maxLength={160} />
              <p className="text-xs text-gray-400 mt-1">{(data.meta_description_es || '').length}/160 caracteres</p>
            </Field>
            <Field label="Imagen Open Graph (URL)">
              <input className="input-base" value={data.og_image || ''} onChange={e => set('og_image', e.target.value)} placeholder="https://..." />
              {data.og_image && <img src={data.og_image} alt="" className="mt-2 h-20 rounded-lg object-cover" onError={e => e.target.style.display = 'none'} />}
            </Field>
          </>
        )}

        {/* AUTHOR TAB */}
        {activeTab === 'author' && (
          <>
            <Field label="Nombre del autor">
              <input className="input-base" value={data.author_name || ''} onChange={e => set('author_name', e.target.value)} />
            </Field>
            <Field label="Avatar URL">
              <input className="input-base" value={data.author_avatar || ''} onChange={e => set('author_avatar', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Bio del autor">
              <textarea className="input-base resize-none" rows={3} value={data.author_bio || ''} onChange={e => set('author_bio', e.target.value)} />
            </Field>
          </>
        )}

        {/* PUBLISH TAB */}
        {activeTab === 'publish' && (
          <>
            <Field label="Imagen destacada (URL)">
              <input className="input-base" value={data.featured_image || ''} onChange={e => set('featured_image', e.target.value)} placeholder="https://..." />
              {data.featured_image && <img src={data.featured_image} alt="" className="mt-2 rounded-xl w-full max-h-48 object-cover" onError={e => e.target.style.display = 'none'} />}
            </Field>
            <Field label="Estado">
              <select className="input-base" value={data.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Borrador</option>
                <option value="scheduled">Programado</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </Field>
            <Field label="Fecha de publicación">
              <input type="datetime-local" className="input-base" value={data.publish_date?.slice(0, 16) || ''} onChange={e => set('publish_date', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Si la fecha es futura, el estado cambiará a "Programado" automáticamente.</p>
            </Field>
            <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4">
              <input type="checkbox" id="featured" checked={data.featured || false} onChange={e => set('featured', e.target.checked)} className="w-4 h-4" />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700">★ Artículo destacado (aparece en primer plano)</label>
            </div>
          </>
        )}

        {/* RELATED TAB */}
        {activeTab === 'related' && (
          <Field label="Artículos relacionados (máx. 3)">
            <div className="space-y-2">
              {otherPosts.slice(0, 30).map(p => {
                const isSelected = (data.related_articles || []).includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        const curr = data.related_articles || [];
                        if (e.target.checked) {
                          if (curr.length < 3) set('related_articles', [...curr, p.id]);
                        } else {
                          set('related_articles', curr.filter(id => id !== p.id));
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700 line-clamp-1">{p.title_es}</span>
                    <span className="text-xs text-gray-400 ml-auto">{p.status}</span>
                  </label>
                );
              })}
            </div>
          </Field>
        )}
      </div>

      <style>{`
        .input-base {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus { border-color: #111827; box-shadow: 0 0 0 3px rgba(17,24,39,0.06); }
        .ql-container { min-height: 350px; font-size: 15px; }
        .ql-editor { min-height: 350px; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  );
}