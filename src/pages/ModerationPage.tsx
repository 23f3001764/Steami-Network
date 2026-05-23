import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ApiStatePanel, ObjectList } from '@/components/ApiStatePanel';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ShieldCheck } from 'lucide-react';
import { NewsletterTab } from '@/components/NewsletterTab';

import { SimulationBuilderTab } from '@/components/SimulationBuilderTab';

// ══════════════════════════════════════════════════════════════════════════════
// INTELLIGENCE FORM — heading · value · color · direction symbol
// ══════════════════════════════════════════════════════════════════════════════

const DIR_SYMBOLS = ['↑','↓','→','←','↗','↘','↙','↖','⬆','⬇','➡','⬅','⟳','●','◆','★'];
const COLOR_OPTIONS = ['cyan','green','gold','red','violet','blue','orange','pink','white'];

const COLOR_MAP: Record<string,string> = {
  cyan:   'rgba(0,217,255,0.15)',   green:  'rgba(16,185,129,0.15)',
  gold:   'rgba(245,158,11,0.15)',  red:    'rgba(239,68,68,0.15)',
  violet: 'rgba(139,92,246,0.15)', blue:   'rgba(59,130,246,0.15)',
  orange: 'rgba(249,115,22,0.15)', pink:   'rgba(236,72,153,0.15)',
  white:  'rgba(255,255,255,0.1)',
};
const COLOR_TEXT: Record<string,string> = {
  cyan:'#00d9ff', green:'#6ee7b7', gold:'#fbbf24', red:'#fca5a5',
  violet:'#c4b5fd', blue:'#93c5fd', orange:'#fdba74', pink:'#f9a8d4', white:'#ffffff',
};

function IntelligenceForm({form, nf, editingId}:{
  form:{id:string;heading:string;value:string;color:string;direction:string;emoji:string};
  nf:(k:any)=>(v:string)=>void;
  editingId:string;
}) {
  const previewBg   = COLOR_MAP[form.color]   ?? COLOR_MAP.cyan;
  const previewText = COLOR_TEXT[form.color]  ?? COLOR_TEXT.cyan;

  return (
    <div className="space-y-4">
      {/* ID */}
      <div>
        <label className="block text-[11px] text-muted-foreground mb-1">ID <span className="text-steami-red">*</span></label>
        <input value={form.id} onChange={e=>nf('id')(e.target.value)} placeholder="e.g. ai-signals-28"
          disabled={!!editingId}
          className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px] disabled:opacity-40"/>
      </div>

      {/* Heading */}
      <div>
        <label className="block text-[11px] text-muted-foreground mb-1">Heading <span className="text-steami-red">*</span></label>
        <input value={form.heading} onChange={e=>nf('heading')(e.target.value)} placeholder="e.g. AI Research Signals"
          className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"/>
      </div>

      {/* Value / Status */}
      <div>
        <label className="block text-[11px] text-muted-foreground mb-1">Value / Status</label>
        <input value={form.value} onChange={e=>nf('value')(e.target.value)} placeholder="e.g. 28% / Active / +1.2k Nodes"
          className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"/>
      </div>

      {/* Emoji */}
      <div>
        <label className="block text-[11px] text-muted-foreground mb-1">Emoji</label>
        <div className="flex items-center gap-2">
          <input value={form.emoji} onChange={e=>nf('emoji')(e.target.value)} placeholder="e.g. ⚛️ 🧬 🤖 ⚡"
            className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[20px]"/>
          {form.emoji && (
            <span className="text-[28px] shrink-0">{form.emoji}</span>
          )}
        </div>
        {/* Quick-pick common science emojis */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['⚛️','🧬','🤖','⚡','🔬','🧪','🌌','💡','🔭','🧠','🦠','🛸','🌊','⚗️','🔋','🧲'].map(e=>(
            <button key={e} type="button" onClick={()=>nf('emoji')(e)}
              className="text-[20px] w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:scale-110"
              style={{
                background: form.emoji===e ? 'rgba(0,217,255,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${form.emoji===e ? 'rgba(0,217,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-[11px] text-muted-foreground mb-2">Colour</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(c=>(
            <button key={c} type="button" onClick={()=>nf('color')(c)}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{
                background: COLOR_TEXT[c],
                borderColor: form.color===c ? '#fff' : 'transparent',
                boxShadow: form.color===c ? `0 0 8px ${COLOR_TEXT[c]}` : 'none',
              }}
              title={c}/>
          ))}
        </div>
      </div>

      {/* Direction symbol keyboard */}
      <div>
        <label className="block text-[11px] text-muted-foreground mb-2">Direction Symbol</label>
        <div className="grid grid-cols-8 gap-1.5">
          {DIR_SYMBOLS.map(sym=>(
            <button key={sym} type="button" onClick={()=>nf('direction')(sym)}
              className="flex items-center justify-center rounded-md text-[18px] h-9 border transition-all"
              style={{
                background: form.direction===sym ? previewBg : 'rgba(255,255,255,0.03)',
                borderColor: form.direction===sym ? previewText : 'rgba(255,255,255,0.08)',
                color: form.direction===sym ? previewText : 'rgba(255,255,255,0.5)',
              }}>
              {sym}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          Selected: <span style={{color:previewText}}>{form.direction || '—'}</span>
        </p>
      </div>

      {/* Live preview — card + ticker pill */}
      {form.heading && (
        <div className="space-y-3">
          {/* Card preview */}
          <div className="rounded-xl p-4 border"
            style={{background:previewBg, borderColor:`${previewText}33`}}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2"
              style={{color:previewText, opacity:0.6}}>Card Preview</p>
            <p className="font-serif text-[15px] font-bold text-white mb-1">
              {form.emoji && <span className="mr-2">{form.emoji}</span>}{form.heading}
            </p>
            <p className="font-mono text-[20px] font-bold" style={{color:previewText, textShadow:`0 0 12px ${previewText}55`}}>
              {form.direction} {form.value}
            </p>
          </div>
          {/* Ticker pill preview */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2"
              style={{color:previewText, opacity:0.6}}>Ticker Pill Preview</p>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full"
              style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}>
              <div className="w-4 h-4 rounded-full flex-shrink-0"
                style={{background:`${previewText}30`, border:`1px solid ${previewText}60`}} />
              <span className="text-sm font-medium text-white">
                {form.emoji && <span className="mr-1">{form.emoji}</span>}{form.heading}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{background:`${previewText}18`, color:previewText}}>
                {form.direction} {form.value}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SHARED FORM STATE + HELPERS
// ══════════════════════════════════════════════════════════════════════════════

const emptyExplainer = {
  id:'',title:'',subtitle:'',field:'',badgeColor:'',readTime:'',author:'',
  content:'',keyInsights:'',context:'',technicalDetail:'',impact:'',references:'',
};
const emptyResearch = {
  id:'',title:'',field:'',abstract:'',author:'',date:'',readTime:'',
  content:'',quotes:'',keyFindings:'',relatedTopics:'',references:'',citations:'',
};
const emptyBlog = {
  id:'',title:'',subtitle:'',description:'',field:'',badgeColor:'',
  coverImage:'',tags:'',keyInsights:'',type:'article',simulationUrl:'',
  content:'',publishDate:'',readingTime:'',
  authorName:'',authorRole:'',authorAvatar:'',authorBio:'',
  references:'',citations:'',
};
const emptySimulation = {
  id:'',title:'',field:'',fieldColor:'steami-badge-cyan',
  description:'',caption:'',readTime:'10 min interactive',
  simulation_type:'custom',component_id:'',insights:'',tags:'',references:'',
};

const emptyIntelligence = {
  id:'', heading:'', value:'', color:'cyan', direction:'↑', emoji:'',
};

const lines     = (s:string) => s.split('\n').map(l=>l.trim()).filter(Boolean);
const csv       = (s:string) => s.split(',').map(l=>l.trim()).filter(Boolean);
const parseRefs = (s:string) => s.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
  try{return JSON.parse(l);}catch{return{title:l};}
});
// parseCitations: each line is a citation row, tab/pipe-separated or JSON
// Supported formats per line:
//   [1] Text of the cited claim | Source Title | https://url | 2026-05-01
//   {"id":"1","text":"...","source_title":"...","source_url":"...","accessed_date":"..."}
const parseCitations = (s:string): {id:string;text:string;source_title:string;source_url?:string;accessed_date?:string}[] =>
  s.split('\n').map(l=>l.trim()).filter(Boolean).map((l,i)=>{
    try { return JSON.parse(l); } catch {}
    // Try pipe-separated: [1] text | source | url | date
    const bracketMatch = l.match(/^\[(\w+)\]\s*/);
    const id = bracketMatch ? bracketMatch[1] : String(i+1);
    const rest = bracketMatch ? l.slice(bracketMatch[0].length) : l;
    const parts = rest.split('|').map(p=>p.trim());
    return {
      id,
      text:          parts[0] || '',
      source_title:  parts[1] || '',
      source_url:    parts[2] || undefined,
      accessed_date: parts[3] || undefined,
    };
  });

function Field({label,value,onChange,placeholder='',required=false,disabled=false}:{
  label:string;value:string;onChange:(v:string)=>void;placeholder?:string;required?:boolean;disabled?:boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">
        {label}{required&&<span className="text-steami-red ml-1">*</span>}
      </label>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||label}
        required={required} disabled={disabled}
        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px] disabled:opacity-40" />
    </div>
  );
}
function TextArea({label,value,onChange,rows=4,hint=''}:{
  label:string;value:string;onChange:(v:string)=>void;rows?:number;hint?:string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      {hint&&<p className="text-[10px] text-muted-foreground/60 mb-1">{hint}</p>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={label} rows={rows}
        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function ModerationPage() {
  const user        = useAuthStore(s=>s.user);
  const isAdmin     = user?.role==='admin';
  const canModerate = isAdmin||user?.role==='mod';

  const [tab,setTab] = useState<'explainer'|'research'|'blog'|'simulation'|'builder'|'newsletter'|'intelligence'>('explainer');

  const [explainerForm, setExplainerForm] = useState(emptyExplainer);
  const [researchForm,  setResearchForm]  = useState(emptyResearch);
  const [blogForm,      setBlogForm]      = useState(emptyBlog);
  const [simForm,       setSimForm]       = useState(emptySimulation);
  const [intelForm,     setIntelForm]     = useState(emptyIntelligence);

  const [editingId,   setEditingId]   = useState('');
  const [imageFile,   setImageFile]   = useState<File|null>(null);
  const [glbFile,     setGlbFile]     = useState<File|null>(null);
  const [snapshotB64, setSnapshotB64] = useState('');
  const [items,       setItems]       = useState<any[]>([]);
  const [status,      setStatus]      = useState('');
  const [error,       setError]       = useState('');

  const ef = (k:keyof typeof emptyExplainer) => (v:string) => setExplainerForm(f=>({...f,[k]:v}));
  const rf = (k:keyof typeof emptyResearch)  => (v:string) => setResearchForm(f=>({...f,[k]:v}));
  const bf = (k:keyof typeof emptyBlog)      => (v:string) => setBlogForm(f=>({...f,[k]:v}));
  const sf = (k:keyof typeof emptySimulation)=> (v:string) => setSimForm(f=>({...f,[k]:v}));
  const nf = (k:keyof typeof emptyIntelligence)=> (v:string) => setIntelForm(f=>({...f,[k]:v}));

  const resetAll = () => {
    setExplainerForm(emptyExplainer); setResearchForm(emptyResearch);
    setBlogForm(emptyBlog);           setSimForm(emptySimulation);
    setEditingId(''); setImageFile(null); setGlbFile(null); setSnapshotB64('');
    setIntelForm(emptyIntelligence);
  };

  const loadItems = async () => {
    setError('');
    try {
      let data:any;
      if      (tab==='explainer')  data = await api.content.cmsExplainers();
      else if (tab==='research')   data = await api.content.cmsResearch();
      else if (tab==='simulation') data = await api.simulations.cmsList();
      else if (tab==='blog')       data = await api.content.cmsBlog();
      else if (tab==='intelligence') data = await api.content.cmsIntelligence();
      else return;
      setItems(Array.isArray(data)?data:data?.nodes??data?.simulations??data?.items??data?.articles??data?.explainers??data?.posts??[]);
    } catch(err:any){setError(err.message||'Unable to load items');}
  };

  useEffect(()=>{if(canModerate&&tab!=='newsletter'&&tab!=='builder')loadItems();},[canModerate,tab]);

  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setStatus(''); setError('');
    try {
      if (tab==='explainer') {
        if (editingId) {
          await api.content.updateExplainer(editingId,{
            title:explainerForm.title||undefined,subtitle:explainerForm.subtitle||undefined,
            field:explainerForm.field||undefined,badgeColor:explainerForm.badgeColor||undefined,
            readTime:explainerForm.readTime||undefined,author:explainerForm.author||undefined,
            content:lines(explainerForm.content),keyInsights:lines(explainerForm.keyInsights),
            context:explainerForm.context||undefined,technicalDetail:explainerForm.technicalDetail||undefined,
            impact:explainerForm.impact||undefined,references:parseRefs(explainerForm.references),
          });
          if(imageFile)await api.content.uploadExplainerImage(editingId,imageFile);
        } else {
          if(!imageFile){setError('Image required.');return;}
          await api.content.createExplainerWithImage({
            id:explainerForm.id,title:explainerForm.title,subtitle:explainerForm.subtitle,
            field:explainerForm.field,badgeColor:explainerForm.badgeColor,readTime:explainerForm.readTime,
            author:explainerForm.author,context:explainerForm.context,technicalDetail:explainerForm.technicalDetail,
            impact:explainerForm.impact,content:JSON.stringify(lines(explainerForm.content)),
            keyInsights:JSON.stringify(lines(explainerForm.keyInsights)),
            references:JSON.stringify(parseRefs(explainerForm.references)),
          },imageFile);
        }
      } else if (tab==='research') {
        if (editingId) {
          await api.content.updateResearch(editingId,{
            title:researchForm.title||undefined,field:researchForm.field||undefined,
            abstract:researchForm.abstract||undefined,author:researchForm.author||undefined,
            date:researchForm.date||undefined,readTime:researchForm.readTime||undefined,
            content:lines(researchForm.content),quotes:lines(researchForm.quotes),
            keyFindings:lines(researchForm.keyFindings),relatedTopics:lines(researchForm.relatedTopics),
            references:parseRefs(researchForm.references),
            citations:parseCitations(researchForm.citations),
          });
          if(imageFile)await api.content.uploadResearchImage(editingId,imageFile);
        } else {
          if(!imageFile){setError('Image required.');return;}
          await api.content.createResearchWithImage({
            id:researchForm.id,title:researchForm.title,field:researchForm.field,
            abstract:researchForm.abstract,author:researchForm.author,date:researchForm.date,
            readTime:researchForm.readTime,content:JSON.stringify(lines(researchForm.content)),
            quotes:JSON.stringify(lines(researchForm.quotes)),
            keyFindings:JSON.stringify(lines(researchForm.keyFindings)),
            relatedTopics:JSON.stringify(lines(researchForm.relatedTopics)),
            references:JSON.stringify(parseRefs(researchForm.references)),
            citations:JSON.stringify(parseCitations(researchForm.citations)),
          },imageFile);
        }
      } else if (tab==='blog') {
        const b={
          id:blogForm.id,title:blogForm.title,subtitle:blogForm.subtitle,description:blogForm.description,
          field:blogForm.field,badgeColor:blogForm.badgeColor||'cyan',coverImage:blogForm.coverImage,
          tags:csv(blogForm.tags),keyInsights:lines(blogForm.keyInsights),type:blogForm.type||'article',
          simulationUrl:blogForm.simulationUrl,content:blogForm.content,
          publishDate:blogForm.publishDate||new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
          readingTime:blogForm.readingTime||`${Math.max(1,Math.ceil(blogForm.content.length/1000))} MIN READ`,
          author:{name:blogForm.authorName||user?.fullName||'',role:blogForm.authorRole||user?.role||'',avatar:blogForm.authorAvatar||'',bio:blogForm.authorBio||''},
          references:parseRefs(blogForm.references),
          citations:parseCitations(blogForm.citations),
        };
        if(editingId)await api.content.updateBlogPost(editingId,b);
        else await api.content.createBlogPost(b);
        if(imageFile)await api.content.uploadBlogCover(editingId||blogForm.id,imageFile);
      } else if (tab==='simulation') {
        const s={
          id:simForm.id,title:simForm.title,field:simForm.field,fieldColor:simForm.fieldColor||'steami-badge-cyan',
          description:simForm.description,caption:simForm.caption,readTime:simForm.readTime||'10 min interactive',
          simulation_type:simForm.simulation_type||'custom',component_id:simForm.component_id,
          insights:lines(simForm.insights),tags:csv(simForm.tags),
          references:parseRefs(simForm.references),
        };
        if(editingId)await api.simulations.update(editingId,s);
        else{if(!simForm.id||!simForm.title){setError('ID and Title required.');return;}await api.simulations.create(s);}
        const tid=editingId||simForm.id;
        if(snapshotB64)await api.simulations.uploadSnapshot(tid,snapshotB64);
        if(glbFile)await api.simulations.uploadGlb(tid,glbFile);
      } else if (tab==='intelligence') {
        if(!intelForm.id||!intelForm.heading){setError('ID and Heading required.');return;}
        const node={
          id:intelForm.id,
          heading:intelForm.heading,
          value:intelForm.value,
          color:intelForm.color,
          direction:intelForm.direction,
          emoji:intelForm.emoji||undefined,
        };
        if(editingId) await api.content.updateIntelligenceNode(editingId,node);
        else          await api.content.createIntelligenceNode({...node,article_id:intelForm.id,title:intelForm.heading});
      }
      setStatus('Saved successfully.'); resetAll(); loadItems();
    } catch(err:any){setError(err.message||'Save failed');}
  };

  const editItem = async (item:any) => {
    const id=item.id??item.uid??item.post_id??item.article_id; if(!id)return;
    setStatus('Loading…');setError('');
    let full=item;
    try{
      if(tab==='explainer') full=await api.content.explainer(id);
      if(tab==='research')  full=await api.content.researchArticle(id);
      if(tab==='blog')      full=await api.content.blogPost(id);
      if(tab==='simulation')full=await api.simulations.cmsGet(id);
      if(tab==='intelligence')full=await api.content.cmsIntelligenceNode(id);
    }catch(err:any){setError(err.message||'Could not load');setStatus('');return;}
    setEditingId(id);setImageFile(null);setGlbFile(null);setSnapshotB64('');
    if(tab==='explainer')setExplainerForm({
      id:full.id??id,title:full.title??'',subtitle:full.subtitle??'',field:full.field??'',
      badgeColor:full.badgeColor??'',readTime:full.readTime??'',author:full.author??'',
      content:Array.isArray(full.content)?full.content.join('\n'):full.content??'',
      keyInsights:Array.isArray(full.keyInsights)?full.keyInsights.join('\n'):'',
      context:full.context??'',technicalDetail:full.technicalDetail??'',impact:full.impact??'',
      references:Array.isArray(full.references)?full.references.map((r:any)=>JSON.stringify(r)).join('\n'):'',
    });
    else if(tab==='research')setResearchForm({
      id:full.id??id,title:full.title??'',field:full.field??'',abstract:full.abstract??'',
      author:full.author??'',date:full.date??'',readTime:full.readTime??'',
      content:Array.isArray(full.content)?full.content.join('\n'):full.content??'',
      quotes:Array.isArray(full.quotes)?full.quotes.join('\n'):'',
      keyFindings:Array.isArray(full.keyFindings)?full.keyFindings.join('\n'):'',
      relatedTopics:Array.isArray(full.relatedTopics)?full.relatedTopics.join('\n'):'',
      references:Array.isArray(full.references)?full.references.map((r:any)=>JSON.stringify(r)).join('\n'):'',
      citations:Array.isArray(full.citations)?full.citations.map((c:any)=>{
        // Restore to pipe format for easy editing
        if(c.text&&c.source_title) return `[${c.id||'?'}] ${c.text} | ${c.source_title}${c.source_url?` | ${c.source_url}`:''}${c.accessed_date?` | ${c.accessed_date}`:''}`;
        return JSON.stringify(c);
      }).join('\n'):'',
    });
    else if(tab==='blog'){const a=full.author??{};setBlogForm({
      id:full.id??id,title:full.title??'',subtitle:full.subtitle??'',description:full.description??'',
      field:full.field??'',badgeColor:full.badgeColor??'',coverImage:full.coverImage??'',
      tags:Array.isArray(full.tags)?full.tags.join(', '):'',
      keyInsights:Array.isArray(full.keyInsights)?full.keyInsights.join('\n'):'',
      type:full.type??'article',simulationUrl:full.simulationUrl??'',content:full.content??'',
      publishDate:full.publishDate??'',readingTime:full.readingTime??'',
      authorName:a.name??'',authorRole:a.role??'',authorAvatar:a.avatar??'',authorBio:a.bio??'',
      references:Array.isArray(full.references)?full.references.map((r:any)=>JSON.stringify(r)).join('\n'):'',
      citations:Array.isArray(full.citations)?full.citations.map((c:any)=>{
        if(c.text&&c.source_title) return `[${c.id||'?'}] ${c.text} | ${c.source_title}${c.source_url?` | ${c.source_url}`:''}${c.accessed_date?` | ${c.accessed_date}`:''}`;
        return JSON.stringify(c);
      }).join('\n'):'',
    });}
    else if(tab==='simulation')setSimForm({
      id:full.id??id,title:full.title??'',field:full.field??'',fieldColor:full.fieldColor??'steami-badge-cyan',
      description:full.description??'',caption:full.caption??'',readTime:full.readTime??'10 min interactive',
      simulation_type:full.simulation_type??'custom',component_id:full.component_id??'',
      insights:Array.isArray(full.insights)?full.insights.join('\n'):'',
      tags:Array.isArray(full.tags)?full.tags.join(', '):'',
      references:Array.isArray(full.references)?full.references.map((r:any)=>JSON.stringify(r)).join('\n'):'',
    });
    else if(tab==='intelligence')setIntelForm({
      id:full.id??id, heading:full.heading??full.title??'',
      value:full.value??'', color:full.color??'cyan', direction:full.direction??'↑', emoji:full.emoji??'',
    });
    setStatus('Loaded for editing.');
  };

  const deleteItem = async (item:any) => {
    const id=item.id??item.uid??item.post_id??item.article_id; if(!id)return;
    if(tab==='explainer') await api.content.deleteExplainer(id);
    if(tab==='research')  await api.content.deleteResearch(id);
    if(tab==='blog')      await api.content.deleteBlogPost(id);
    if(tab==='simulation')await api.simulations.delete(id);
    if(tab==='intelligence')await api.content.deleteIntelligenceNode(id);
    setStatus('Deleted.'); loadItems();
  };

  if(!canModerate)return(
    <SteamiLayout>
      <div className="glass-card p-8 text-center">
        <ShieldCheck className="w-8 h-8 text-steami-gold mx-auto mb-3" />
        <h1 className="steami-heading text-2xl mb-2">Moderator Access Required</h1>
        <p className="text-muted-foreground text-[14px]">Admin and mod users can create and manage content here.</p>
      </div>
    </SteamiLayout>
  );

  const imageRequired=!editingId&&(tab==='explainer'||tab==='research');

  return (
    <SteamiLayout>
      <div className="mb-8">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">Content Operations</h1>
        <p className="text-[15px] text-muted-foreground max-w-2xl">
          Create and manage explainers, research articles, blog posts, 3D simulations, and more.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['explainer','research','blog','simulation','intelligence','builder','newsletter'] as const).map(t=>(
          <button key={t}
            onClick={()=>{setTab(t);resetAll();setStatus('');setError('');}}
            className={`steami-btn text-[11px] ${tab===t?'steami-btn-gold':''}`}
          >
            {t==='newsletter'?'📰 Newsletter':t==='blog'?'Intelligence':t==='simulation'?'🧊 Simulation':t==='builder'?'🔬 3D Builder':t==='intelligence'?'🌐 Live Network':t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {tab==='newsletter'&&<div className="lg:col-span-2"><NewsletterTab /></div>}

        {tab==='builder'&&<SimulationBuilderTab isAdmin={isAdmin} canModerate={canModerate} />}

        {tab!=='newsletter'&&tab!=='builder'&&(<>
          {/* Form */}
          <section className="glass-card p-5">
            <h2 className="steami-section-label mb-4">{editingId?`Update ${tab}`:`Create ${tab}`}</h2>
            <form onSubmit={submit} className="space-y-3">

              {tab==='explainer'&&<>
                {/* ── Identity ─────────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📋 Identity</p>
                  <Field label="ID" value={explainerForm.id} onChange={ef('id')} required disabled={!!editingId}
                    placeholder="e.g. quantum-dog - URL-safe, lowercase, hyphens only. Once set, cannot be changed."/>
                  <Field label="Title" value={explainerForm.title} onChange={ef('title')} required
                    placeholder="e.g. 'How Quantum Entanglement Works' - shown as the main heading"/>
                  <Field label="Subtitle" value={explainerForm.subtitle} onChange={ef('subtitle')}
                    placeholder="e.g. 'A beginner's guide to spooky action at a distance' - one line teaser below the title"/>
                  <Field label="Field / Category" value={explainerForm.field} onChange={ef('field')}
                    placeholder="e.g. QUANTUM PHYSICS / BIOLOGY / AI - shown as the badge label on the card"/>
                  <Field label="Badge Color" value={explainerForm.badgeColor} onChange={ef('badgeColor')}
                    placeholder="cyan / green / violet / gold / red / blue / orange"/>
                  <Field label="Read Time" value={explainerForm.readTime} onChange={ef('readTime')}
                    placeholder="e.g. 8 MIN READ - estimated reading time shown on the card"/>
                  <Field label="Author" value={explainerForm.author} onChange={ef('author')}
                    placeholder="e.g. Dr. Priya Nair / STEAMI Science Desk"/>
                </div>

                {/* ── Content ──────────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📝 Content</p>
                  <TextArea label="Content Paragraphs" value={explainerForm.content} onChange={ef('content')} rows={7}
                    hint="One paragraph per line. Each line becomes a separate <p> block on the article page. Use [1] [2] markers inline to reference citations below. Write in plain language - explainers target a general audience."/>
                  <TextArea label="Key Insights" value={explainerForm.keyInsights} onChange={ef('keyInsights')} rows={3}
                    hint="One insight per line. These appear as highlighted bullet callouts, e.g. 'Entangled particles respond to each other instantly, regardless of distance.'"/>
                  <TextArea label="Context (Historical/Background)" value={explainerForm.context} onChange={ef('context')} rows={3}
                    hint="Optional. A paragraph giving historical or background context shown in a separate 'Context' section of the explainer."/>
                  <TextArea label="Technical Detail" value={explainerForm.technicalDetail} onChange={ef('technicalDetail')} rows={3}
                    hint="Optional. A deeper-dive paragraph for readers who want the science. Shown in a collapsible 'Technical Detail' section."/>
                  <TextArea label="Real-World Impact" value={explainerForm.impact} onChange={ef('impact')} rows={3}
                    hint="Optional. 1–2 sentences on why this matters in the real world. Shown in the 'Impact' section."/>
                </div>

                {/* ── References ───────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📚 References (Source List)</p>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                    These appear as the <strong>References</strong> section at the bottom of the explainer. One reference per line.<br/>
                    Accepted formats — plain title, or JSON object:<br/>
                    <code className="text-steami-cyan text-[10px]">Wikipedia: Quantum Entanglement</code><br/>
                    <code className="text-steami-cyan text-[10px]">{'{"title":"Quantum Entanglement — Wikipedia","url":"https://en.wikipedia.org/wiki/Quantum_entanglement","type":"website"}'}</code><br/>
                    type options: <span className="text-steami-gold">paper · article · book · website · dataset</span>
                  </p>
                  <TextArea label="References" value={explainerForm.references} onChange={ef('references')} rows={5}
                    hint='One per line. Plain title OR JSON: {"title":"...","url":"...","author":"...","type":"paper"}'/>
                </div>
              </>}

              {tab==='research'&&<>
                {/* ── Identity ─────────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📋 Identity</p>
                  <Field label="ID" value={researchForm.id} onChange={rf('id')} required disabled={!!editingId}
                    placeholder="e.g. topological-qubits - URL-safe, lowercase, hyphens only. Once set, cannot be changed."/>
                  <Field label="Title" value={researchForm.title} onChange={rf('title')} required
                    placeholder="Full article title, e.g. 'Topological Qubits and Fault-Tolerant Computing'"/>
                  <Field label="Field / Category" value={researchForm.field} onChange={rf('field')} required
                    placeholder="e.g. QUANTUM PHYSICS / BIOLOGY / AI - must match a valid STEAMI field"/>
                  <Field label="Author Name" value={researchForm.author} onChange={rf('author')}
                    placeholder="e.g. Dr. Anika Sharma / IIT Madras"/>
                  <Field label="Date (YYYY-MM-DD)" value={researchForm.date} onChange={rf('date')}
                    placeholder="e.g. 2026-04-30 - when this research was published or written"/>
                  <Field label="Read Time" value={researchForm.readTime} onChange={rf('readTime')}
                    placeholder="e.g. 12 MIN READ - estimated reading time shown on the card"/>
                </div>

                {/* ── Abstract & Body ──────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📝 Content</p>
                  <TextArea label="Abstract" value={researchForm.abstract} onChange={rf('abstract')} rows={3}
                    hint="1–2 sentence summary shown on the article card. Keep it under 200 characters."/>
                  <TextArea label="Content Paragraphs" value={researchForm.content} onChange={rf('content')} rows={8}
                    hint="One paragraph per line. Each line becomes a separate <p> block on the article page. Use [1] [2] markers inline to reference citations below."/>
                  <TextArea label="Quotes / Pull Quotes" value={researchForm.quotes} onChange={rf('quotes')} rows={3}
                    hint={'One quote per line. These are displayed as highlighted pull-quotes in the article. Include attribution if needed, e.g. \'"Quantum supremacy is real." \u2014 Dr. Priya Nair\''}/>
                </div>

                {/* ── Key Findings & Topics ────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">🔍 Findings & Topics</p>
                  <TextArea label="Key Findings" value={researchForm.keyFindings} onChange={rf('keyFindings')} rows={4}
                    hint="One finding per line. These appear as a bullet list on the article. Write them as complete sentences, e.g. 'Researchers achieved 99.9% qubit fidelity at room temperature.'"/>
                  <TextArea label="Related Topics" value={researchForm.relatedTopics} onChange={rf('relatedTopics')} rows={2}
                    hint="One topic per line. Used for cross-linking, e.g. 'Quantum Computing' / 'Superconductivity' / 'Error Correction'"/>
                </div>

                {/* ── References ───────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📚 References (Source List)</p>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                    These appear as the <strong>References</strong> section at the bottom of the article. One reference per line.<br/>
                    Accepted formats — plain title, or JSON object:<br/>
                    <code className="text-steami-cyan text-[10px]">Wikipedia: LK-99</code><br/>
                    <code className="text-steami-cyan text-[10px]">{'{"title":"LK-99 — Wikipedia","url":"https://en.wikipedia.org/wiki/LK-99","author":"Wikipedia","type":"website"}'}</code><br/>
                    type options: <span className="text-steami-gold">paper · article · book · website · dataset</span>
                  </p>
                  <TextArea label="References" value={researchForm.references} onChange={rf('references')} rows={6}
                    hint='One per line. Plain title OR JSON: {"title":"...","url":"...","author":"...","type":"paper"}'/>
                </div>

                {/* ── Citations ────────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">🔢 Citations (Inline Numbered)</p>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                    These are the numbered in-text citations like <span className="text-steami-cyan">[1]</span>, <span className="text-steami-cyan">[2]</span> that appear inside your article paragraphs. The reader can click them to jump to the source.<br/><br/>
                    In your <strong>Content Paragraphs</strong> above, write <code className="text-steami-cyan text-[10px]">[1]</code> at the end of a sentence to link to citation #1 here.<br/><br/>
                    Each citation is one line. Use pipe <code className="text-steami-cyan text-[10px]">|</code> to separate fields:<br/>
                    <code className="text-steami-cyan text-[10px]">[1] The claim being cited | Source Title | https://source-url.com | 2026-05-21</code><br/>
                    Or paste full JSON:<br/>
                    <code className="text-steami-cyan text-[10px]">{'{"id":"1","text":"Claim text","source_title":"Nature","source_url":"https://...","accessed_date":"2026-05-21"}'}</code>
                  </p>
                  <TextArea label="Citations" value={researchForm.citations} onChange={rf('citations')} rows={6}
                    hint="One per line. Format: [1] cited text | Source Name | https://url | YYYY-MM-DD"/>
                </div>
              </>}

              {tab==='blog'&&<>
                {/* ── Identity ─────────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📋 Identity</p>
                  <Field label="ID" value={blogForm.id} onChange={bf('id')} required disabled={!!editingId}
                    placeholder="e.g. future-of-quantum - URL-safe, lowercase, hyphens only. Once set, cannot be changed."/>
                  <Field label="Title" value={blogForm.title} onChange={bf('title')} required
                    placeholder="e.g. 'The Zero-Loss Era: How a Resurrected Crystal is Rewriting Global Power'"/>
                  <Field label="Subtitle" value={blogForm.subtitle} onChange={bf('subtitle')}
                    placeholder="e.g. 'Three global labs have validated ambient superconductivity in a lead apatite derivative'"/>
                  <Field label="Description" value={blogForm.description} onChange={bf('description')}
                    placeholder="2–3 sentence teaser shown in cards and social previews"/>
                  <Field label="Field / Category" value={blogForm.field} onChange={bf('field')}
                    placeholder="e.g. QUANTUM PHYSICS / AI / BIOLOGY - shown as the badge label"/>
                  <Field label="Badge Color" value={blogForm.badgeColor} onChange={bf('badgeColor')}
                    placeholder="cyan / green / violet / gold / red / blue / orange - controls badge colour"/>
                  <Field label="Type" value={blogForm.type} onChange={bf('type')}
                    placeholder="article (default) / explainer / simulation - determines how it is rendered"/>
                  <Field label="Tags (comma-separated)" value={blogForm.tags} onChange={bf('tags')}
                    placeholder="e.g. superconductivity, geopolitics, energy - used for filtering"/>
                  <Field label="Publish Date" value={blogForm.publishDate} onChange={bf('publishDate')}
                    placeholder="e.g. May 22, 2026 - shown below the title. Leave blank to auto-fill today."/>
                  <Field label="Reading Time" value={blogForm.readingTime} onChange={bf('readingTime')}
                    placeholder="e.g. 14 MIN READ - leave blank to auto-calculate from content length"/>
                </div>

                {/* ── Content ──────────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📝 Content</p>
                  <TextArea label="Key Insights" value={blogForm.keyInsights} onChange={bf('keyInsights')} rows={3}
                    hint="One insight per line. These appear as bullet callouts at the top of the article, e.g. 'Three independent labs confirmed the result simultaneously.'"/>
                  <TextArea label="Article Body (Markdown)" value={blogForm.content} onChange={bf('content')} rows={12}
                    hint="Full article body in Markdown. Use **bold**, ## headings, > blockquotes. One paragraph per line — each line becomes a separate block. Use [1] [2] markers in the text to reference the inline citations added below."/>
                  <Field label="Simulation URL (if type=simulation)" value={blogForm.simulationUrl} onChange={bf('simulationUrl')}
                    placeholder="Only fill this if Type = simulation. Leave blank otherwise."/>
                  <Field label="Cover Image URL" value={blogForm.coverImage} onChange={bf('coverImage')}
                    placeholder="Paste a Cloudinary/CDN URL here, OR leave blank and upload an image file below"/>
                </div>

                {/* ── Author ───────────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">✍️ Author</p>
                  <Field label="Author Name" value={blogForm.authorName} onChange={bf('authorName')}
                    placeholder={user?.fullName||'e.g. Shashi Kushwaha'}/>
                  <Field label="Author Role / Title" value={blogForm.authorRole} onChange={bf('authorRole')}
                    placeholder="e.g. Science Writer / Senior Analyst / IIT Madras"/>
                  <Field label="Author Avatar URL" value={blogForm.authorAvatar} onChange={bf('authorAvatar')}
                    placeholder="Paste a URL for the author's profile photo (optional)"/>
                  <Field label="Author Bio" value={blogForm.authorBio} onChange={bf('authorBio')}
                    placeholder="1–2 sentence bio shown at the end of the article (optional)"/>
                </div>

                {/* ── References ───────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📚 References (Source List)</p>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                    These appear as the <strong>References / Works Cited</strong> section at the bottom of the article. One reference per line.<br/>
                    Accepted formats — plain title, or JSON object:<br/>
                    <code className="text-steami-cyan text-[10px]">Wikipedia: LK-99</code><br/>
                    <code className="text-steami-cyan text-[10px]">{'{"title":"LK-99 — Wikipedia","url":"https://en.wikipedia.org/wiki/LK-99","author":"Wikipedia","type":"website"}'}</code><br/>
                    type options: <span className="text-steami-gold">paper · article · book · website · dataset</span>
                  </p>
                  <TextArea label="References" value={blogForm.references} onChange={bf('references')} rows={6}
                    hint='One per line. Plain title OR JSON: {"title":"...","url":"...","author":"...","type":"article"}'/>
                </div>

                {/* ── Citations ────────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">🔢 Citations (Inline Numbered)</p>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                    Numbered citations like <span className="text-steami-cyan">[1]</span>, <span className="text-steami-cyan">[2]</span> that appear inside your article body. Readers can click them to jump to the source.<br/><br/>
                    In your <strong>Article Body</strong> above, place <code className="text-steami-cyan text-[10px]">[1]</code> at the end of the sentence you want to cite. Then add the matching citation here.<br/><br/>
                    Each citation is one line. Pipe <code className="text-steami-cyan text-[10px]">|</code> separates fields:<br/>
                    <code className="text-steami-cyan text-[10px]">[1] The claim being cited | Source Title | https://source-url.com | 2026-05-21</code><br/>
                    Or paste full JSON:<br/>
                    <code className="text-steami-cyan text-[10px]">{'{"id":"1","text":"Claim text","source_title":"Nature","source_url":"https://...","accessed_date":"2026-05-21"}'}</code>
                  </p>
                  <TextArea label="Citations" value={blogForm.citations} onChange={bf('citations')} rows={8}
                    hint="One per line. Format: [1] cited text | Source Name | https://url | YYYY-MM-DD"/>
                </div>
              </>}

              {tab==='simulation'&&<>
                {/* ── Identity ─────────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📋 Identity</p>
                  <Field label="ID" value={simForm.id} onChange={sf('id')} required disabled={!!editingId}
                    placeholder="e.g. wave-function - URL-safe, lowercase, hyphens. Once set, cannot be changed."/>
                  <Field label="Title" value={simForm.title} onChange={sf('title')} required
                    placeholder="e.g. 'Wave Function Collapse' - shown as the simulation heading"/>
                  <Field label="Field / Category" value={simForm.field} onChange={sf('field')}
                    placeholder="e.g. QUANTUM PHYSICS / PHYSICS / MATHEMATICS"/>
                  <Field label="Badge Color Class" value={simForm.fieldColor} onChange={sf('fieldColor')}
                    placeholder="steami-badge-cyan / steami-badge-violet / steami-badge-green / steami-badge-gold"/>
                </div>

                {/* ── Simulation Config ────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">⚙️ Simulation Config</p>
                  <Field label="Simulation Type" value={simForm.simulation_type} onChange={sf('simulation_type')}
                    placeholder="bloch_sphere / three_body / custom - determines the renderer used"/>
                  <Field label="Component ID" value={simForm.component_id} onChange={sf('component_id')}
                    placeholder="quantum / threebody / your-key - must match the React component key in SimulationsPage.tsx"/>
                  <Field label="Read Time" value={simForm.readTime} onChange={sf('readTime')}
                    placeholder="e.g. 12 min interactive - shown on the simulation card"/>
                </div>

                {/* ── Description & Insights ───────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📝 Description & Insights</p>
                  <TextArea label="Description" value={simForm.description} onChange={sf('description')} rows={3}
                    hint="2–3 sentence explanation of what this simulation shows. Displayed above the interactive canvas."/>
                  <Field label="Caption" value={simForm.caption} onChange={sf('caption')}
                    placeholder="Short caption shown below the canvas, e.g. 'Interactive Bloch Sphere - drag to rotate'"/>
                  <TextArea label="Key Insights" value={simForm.insights} onChange={sf('insights')} rows={4}
                    hint="One insight per line - plain-language takeaways shown as bullet points. Write for a general audience, e.g. 'A qubit is like a spinning coin - both 0 and 1 until measured.'"/>
                  <Field label="Tags (comma-separated)" value={simForm.tags} onChange={sf('tags')}
                    placeholder="e.g. quantum, physics, interactive - used for filtering"/>
                </div>

                {/* ── References ───────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📚 References (Source List)</p>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                    These appear below the simulation as the <strong>References</strong> section. One reference per line.<br/>
                    Accepted formats — plain title, or JSON:<br/>
                    <code className="text-steami-cyan text-[10px]">Wikipedia: Bloch Sphere</code><br/>
                    <code className="text-steami-cyan text-[10px]">{'{"title":"Bloch Sphere — Wikipedia","url":"https://en.wikipedia.org/wiki/Bloch_sphere","type":"website"}'}</code>
                  </p>
                  <TextArea label="References" value={simForm.references} onChange={sf('references')} rows={4}
                    hint='One per line. Plain title OR JSON: {"title":"...","url":"...","author":"...","type":"paper"}'/>
                </div>

                {/* ── Media ────────────────────────────────────────────── */}
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">🖼️ Preview Snapshot</p>
                  <p className="text-[11px] text-muted-foreground/60">Upload a PNG/JPEG screenshot of the simulation used as the card thumbnail.</p>
                  <input type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{if(typeof r.result==='string')setSnapshotB64(r.result);};r.readAsDataURL(f);}}
                    className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"/>
                  {snapshotB64&&<img src={snapshotB64} alt="Preview" className="w-full rounded-md object-cover" style={{maxHeight:120}}/>}
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">📦 3-D File (.glb/.gltf)</p>
                  <p className="text-[11px] text-muted-foreground/60">Upload a .glb or .gltf 3-D model file if this simulation uses a pre-built mesh. Leave blank for JS-rendered simulations.</p>
                  <input type="file" accept=".glb,.gltf,.obj,.fbx,.stl" onChange={e=>setGlbFile(e.target.files?.[0]??null)}
                    className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"/>
                  {glbFile&&<p className="text-[11px] text-steami-green">Selected: {glbFile.name}</p>}
                </div>
              </>}


              {tab==='intelligence'&&<IntelligenceForm form={intelForm} nf={nf} editingId={editingId}/>}

              {(tab==='explainer'||tab==='research'||tab==='blog')&&(
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">
                    {tab==='blog'?'Cover Image (optional)':editingId?'Replace Image (optional)':<span>Image File <span className="text-steami-red">*</span></span>}
                  </label>
                  <input type="file" accept="image/*" required={imageRequired} onChange={e=>setImageFile(e.target.files?.[0]??null)}
                    className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"/>
                  {imageFile&&<p className="text-[11px] text-steami-green mt-1">Selected: {imageFile.name}</p>}
                </div>
              )}

              {status&&<p className="text-[12px] text-steami-green">{status}</p>}
              {error &&<p className="text-[12px] text-steami-red">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button className="steami-btn text-[11px]" type="submit">{editingId?'Update':'Create'}</button>
                {tab==='simulation'&&isAdmin&&!editingId&&(
                  <button type="button" className="steami-btn text-[11px]"
                    onClick={async()=>{setStatus('');setError('');try{const r=await api.simulations.seed();setStatus(`Seeded ${r?.seeded??'?'}.`);loadItems();}catch(e:any){setError(e.message);}}}>
                    ↻ Seed Defaults
                  </button>
                )}
                {editingId&&<button type="button" className="steami-btn text-[11px]" onClick={()=>{resetAll();setStatus('');setError('');}}>New</button>}
              </div>
            </form>
          </section>

          {/* List */}
          <ApiStatePanel title={`Backend ${tab}s`} error={error} onRefresh={loadItems}>
            <div className="space-y-2">
              {items.map((item,idx)=>(
                <div key={item.id??item.uid??idx} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-start gap-3">
                    {/* Simulation preview: snapshot thumbnail or preset icon */}
                    {tab==='simulation'&&(()=>{
                      if (item.snapshot_url) {
                        return (
                          <img src={item.snapshot_url} alt={item.title}
                            className="w-20 h-14 rounded object-cover flex-shrink-0 border border-white/10" />
                        );
                      }
                      const icons: Record<string,string> = {
                        bloch:'⚛', quantum:'⚛', threebody:'🌌', wave:'〜', orbits:'🪐', blank:'◻'
                      };
                      const icon = icons[item.component_id as string] ?? '🔬';
                      return (
                        <div className="w-20 h-14 rounded flex-shrink-0 border border-white/10 flex items-center justify-center text-2xl"
                          style={{background:'#03060f'}}>
                          {icon}
                        </div>
                      );
                    })()}
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-[16px] font-bold">{item.title??item.id??`Record ${idx+1}`}</div>
                      <p className="text-[13px] text-muted-foreground line-clamp-2">
                        {item.description??item.subtitle??item.abstract??item.content??''}
                      </p>
                      {tab==='simulation'&&item.component_id&&(
                        <span className="font-mono text-[10px] text-steami-cyan">component_id: {item.component_id}</span>
                      )}
                    </div>
                    <button className="steami-btn text-[11px]" onClick={()=>editItem(item)}>Edit</button>
                    {(tab!=='simulation'||isAdmin)&&(
                      <button className="steami-btn text-[11px]" onClick={()=>deleteItem(item)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
              {items.length===0&&<ObjectList items={[]}/>}
            </div>
          </ApiStatePanel>
        </>)}
      </div>
    </SteamiLayout>
  );
}
