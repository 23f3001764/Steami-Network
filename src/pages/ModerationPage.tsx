import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ApiStatePanel, ObjectList } from '@/components/ApiStatePanel';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ShieldCheck } from 'lucide-react';
import { NewsletterTab } from '@/components/NewsletterTab';

import { SimulationBuilderTab } from '@/components/SimulationBuilderTab';

// SHARED FORM STATE + HELPERS
// ══════════════════════════════════════════════════════════════════════════════

const emptyExplainer = {
  id:'',title:'',subtitle:'',field:'',badgeColor:'',readTime:'',author:'',
  content:'',keyInsights:'',context:'',technicalDetail:'',impact:'',references:'',
};
const emptyResearch = {
  id:'',title:'',field:'',abstract:'',author:'',date:'',readTime:'',
  content:'',quotes:'',keyFindings:'',relatedTopics:'',
};
const emptyBlog = {
  id:'',title:'',subtitle:'',description:'',field:'',badgeColor:'',
  coverImage:'',tags:'',keyInsights:'',type:'article',simulationUrl:'',
  content:'',publishDate:'',readingTime:'',
  authorName:'',authorRole:'',authorAvatar:'',authorBio:'',
};
const emptySimulation = {
  id:'',title:'',field:'',fieldColor:'steami-badge-cyan',
  description:'',caption:'',readTime:'10 min interactive',
  simulation_type:'custom',component_id:'',insights:'',tags:'',
};
const emptyIntelligence = {
  id:'',article_id:'',title:'',topic:'',source:'',article_url:'',
  matched_domains:'',
  ai_summary:'',ai_key_points:'',ai_sentiment:'positive',
  ai_sentiment_label:'neutral_news',ai_emoji:'',ai_confidence:'',
  ai_tags:'',ai_domain:'',ai_reading_time_min:'',ai_article_url:'',
};

const lines = (s:string) => s.split('\n').map(l=>l.trim()).filter(Boolean);
const csv   = (s:string) => s.split(',').map(l=>l.trim()).filter(Boolean);
const parseRefs = (s:string) => s.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
  try{return JSON.parse(l);}catch{return{title:l};}
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
    setIntelForm(emptyIntelligence);
    setEditingId(''); setImageFile(null); setGlbFile(null); setSnapshotB64('');
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
      setItems(Array.isArray(data)?data:data?.simulations??data?.nodes??data?.items??data?.articles??data?.explainers??data?.posts??[]);
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
        };
        if(editingId)await api.simulations.update(editingId,s);
        else{if(!simForm.id||!simForm.title){setError('ID and Title required.');return;}await api.simulations.create(s);}
        const tid=editingId||simForm.id;
        if(snapshotB64)await api.simulations.uploadSnapshot(tid,snapshotB64);
        if(glbFile)await api.simulations.uploadGlb(tid,glbFile);
      } else if (tab==='intelligence') {
        const aiInsight = {
          summary:          intelForm.ai_summary||undefined,
          key_points:       intelForm.ai_key_points?intelForm.ai_key_points.split('\n').map((l:string)=>l.trim()).filter(Boolean):undefined,
          sentiment:        intelForm.ai_sentiment||undefined,
          sentiment_label:  intelForm.ai_sentiment_label||undefined,
          emoji:            intelForm.ai_emoji||undefined,
          confidence:       intelForm.ai_confidence?parseFloat(intelForm.ai_confidence):undefined,
          tags:             intelForm.ai_tags?intelForm.ai_tags.split(',').map((l:string)=>l.trim()).filter(Boolean):undefined,
          domain:           intelForm.ai_domain||undefined,
          reading_time_min: intelForm.ai_reading_time_min?parseInt(intelForm.ai_reading_time_min):undefined,
          article_url:      intelForm.ai_article_url||undefined,
        };
        const node = {
          id:              intelForm.id,
          article_id:      intelForm.article_id,
          title:           intelForm.title,
          topic:           intelForm.topic||undefined,
          source:          intelForm.source||undefined,
          article_url:     intelForm.article_url||undefined,
          matched_domains: intelForm.matched_domains?intelForm.matched_domains.split(',').map((l:string)=>l.trim()).filter(Boolean):[],
          ai_insight:      aiInsight,
        };
        if(editingId) await api.content.updateIntelligenceNode(editingId, node);
        else {
          if(!intelForm.id||!intelForm.title){setError('ID and Title required.');return;}
          await api.content.createIntelligenceNode(node);
        }
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
    });
    else if(tab==='blog'){const a=full.author??{};setBlogForm({
      id:full.id??id,title:full.title??'',subtitle:full.subtitle??'',description:full.description??'',
      field:full.field??'',badgeColor:full.badgeColor??'',coverImage:full.coverImage??'',
      tags:Array.isArray(full.tags)?full.tags.join(', '):'',
      keyInsights:Array.isArray(full.keyInsights)?full.keyInsights.join('\n'):'',
      type:full.type??'article',simulationUrl:full.simulationUrl??'',content:full.content??'',
      publishDate:full.publishDate??'',readingTime:full.readingTime??'',
      authorName:a.name??'',authorRole:a.role??'',authorAvatar:a.avatar??'',authorBio:a.bio??'',
    });}
    else if(tab==='simulation')setSimForm({
      id:full.id??id,title:full.title??'',field:full.field??'',fieldColor:full.fieldColor??'steami-badge-cyan',
      description:full.description??'',caption:full.caption??'',readTime:full.readTime??'10 min interactive',
      simulation_type:full.simulation_type??'custom',component_id:full.component_id??'',
      insights:Array.isArray(full.insights)?full.insights.join('\n'):'',
      tags:Array.isArray(full.tags)?full.tags.join(', '):'',
    });
    else if(tab==='intelligence'){const ai=full.ai_insight??{};setIntelForm({
      id:full.id??id,article_id:full.article_id??'',title:full.title??'',
      topic:full.topic??'',source:full.source??'',article_url:full.article_url??'',
      matched_domains:Array.isArray(full.matched_domains)?full.matched_domains.join(', '):'',
      ai_summary:ai.summary??'',
      ai_key_points:Array.isArray(ai.key_points)?ai.key_points.join('\n'):'',
      ai_sentiment:ai.sentiment??'positive',ai_sentiment_label:ai.sentiment_label??'neutral_news',
      ai_emoji:ai.emoji??'',ai_confidence:ai.confidence!=null?String(ai.confidence):'',
      ai_tags:Array.isArray(ai.tags)?ai.tags.join(', '):'',ai_domain:ai.domain??'',
      ai_reading_time_min:ai.reading_time_min!=null?String(ai.reading_time_min):'',
      ai_article_url:ai.article_url??'',
    });}
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
                <Field label="ID" value={explainerForm.id} onChange={ef('id')} required disabled={!!editingId} placeholder="e.g. quantum-dog"/>
                <Field label="Title" value={explainerForm.title} onChange={ef('title')} required/>
                <Field label="Subtitle" value={explainerForm.subtitle} onChange={ef('subtitle')}/>
                <Field label="Field (e.g. QUANTUM PHYSICS)" value={explainerForm.field} onChange={ef('field')}/>
                <Field label="Badge Color" value={explainerForm.badgeColor} onChange={ef('badgeColor')} placeholder="cyan/green/violet/gold"/>
                <Field label="Read Time" value={explainerForm.readTime} onChange={ef('readTime')} placeholder="8 MIN READ"/>
                <Field label="Author" value={explainerForm.author} onChange={ef('author')}/>
                <TextArea label="Content" value={explainerForm.content} onChange={ef('content')} rows={6} hint="One paragraph per line."/>
                <TextArea label="Key Insights" value={explainerForm.keyInsights} onChange={ef('keyInsights')} rows={3} hint="One per line."/>
                <TextArea label="Context" value={explainerForm.context} onChange={ef('context')} rows={3}/>
                <TextArea label="Technical Detail" value={explainerForm.technicalDetail} onChange={ef('technicalDetail')} rows={3}/>
                <TextArea label="Impact" value={explainerForm.impact} onChange={ef('impact')} rows={3}/>
                <TextArea label="References" value={explainerForm.references} onChange={ef('references')} rows={4}
                  hint='One per line as JSON: {"title":"...","url":"...","author":"...","type":"paper"}'/>
              </>}

              {tab==='research'&&<>
                <Field label="ID" value={researchForm.id} onChange={rf('id')} required disabled={!!editingId} placeholder="e.g. topological-qubits"/>
                <Field label="Title" value={researchForm.title} onChange={rf('title')} required/>
                <Field label="Field" value={researchForm.field} onChange={rf('field')} required/>
                <Field label="Abstract" value={researchForm.abstract} onChange={rf('abstract')}/>
                <Field label="Author" value={researchForm.author} onChange={rf('author')}/>
                <Field label="Date (YYYY-MM-DD)" value={researchForm.date} onChange={rf('date')} placeholder="2026-04-30"/>
                <Field label="Read Time" value={researchForm.readTime} onChange={rf('readTime')}/>
                <TextArea label="Content" value={researchForm.content} onChange={rf('content')} rows={6} hint="One paragraph per line."/>
                <TextArea label="Quotes" value={researchForm.quotes} onChange={rf('quotes')} rows={3} hint="One per line."/>
                <TextArea label="Key Findings" value={researchForm.keyFindings} onChange={rf('keyFindings')} rows={3} hint="One per line."/>
                <TextArea label="Related Topics" value={researchForm.relatedTopics} onChange={rf('relatedTopics')} rows={2} hint="One per line."/>
              </>}

              {tab==='blog'&&<>
                <Field label="ID" value={blogForm.id} onChange={bf('id')} required disabled={!!editingId} placeholder="e.g. future-of-quantum"/>
                <Field label="Title" value={blogForm.title} onChange={bf('title')} required/>
                <Field label="Subtitle" value={blogForm.subtitle} onChange={bf('subtitle')}/>
                <Field label="Description" value={blogForm.description} onChange={bf('description')}/>
                <Field label="Field / Category" value={blogForm.field} onChange={bf('field')}/>
                <Field label="Badge Color" value={blogForm.badgeColor} onChange={bf('badgeColor')}/>
                <Field label="Type (article/simulation)" value={blogForm.type} onChange={bf('type')}/>
                <Field label="Cover Image URL" value={blogForm.coverImage} onChange={bf('coverImage')}/>
                <Field label="Tags (comma-separated)" value={blogForm.tags} onChange={bf('tags')}/>
                <Field label="Publish Date" value={blogForm.publishDate} onChange={bf('publishDate')}/>
                <Field label="Reading Time" value={blogForm.readingTime} onChange={bf('readingTime')}/>
                <Field label="Simulation URL" value={blogForm.simulationUrl} onChange={bf('simulationUrl')}/>
                <TextArea label="Key Insights" value={blogForm.keyInsights} onChange={bf('keyInsights')} rows={3} hint="One per line."/>
                <TextArea label="Content" value={blogForm.content} onChange={bf('content')} rows={8}/>
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Author</p>
                  <Field label="Name" value={blogForm.authorName} onChange={bf('authorName')} placeholder={user?.fullName||'Dr. Jane Smith'}/>
                  <Field label="Role" value={blogForm.authorRole} onChange={bf('authorRole')}/>
                  <Field label="Avatar URL" value={blogForm.authorAvatar} onChange={bf('authorAvatar')}/>
                  <Field label="Bio" value={blogForm.authorBio} onChange={bf('authorBio')}/>
                </div>
              </>}

              {tab==='simulation'&&<>
                <Field label="ID" value={simForm.id} onChange={sf('id')} required disabled={!!editingId} placeholder="e.g. wave-function"/>
                <Field label="Title" value={simForm.title} onChange={sf('title')} required/>
                <Field label="Field" value={simForm.field} onChange={sf('field')}/>
                <Field label="Badge Color class" value={simForm.fieldColor} onChange={sf('fieldColor')} placeholder="steami-badge-cyan"/>
                <TextArea label="Description" value={simForm.description} onChange={sf('description')} rows={3}/>
                <Field label="Caption" value={simForm.caption} onChange={sf('caption')}/>
                <Field label="Read Time" value={simForm.readTime} onChange={sf('readTime')}/>
                <Field label="Simulation Type" value={simForm.simulation_type} onChange={sf('simulation_type')} placeholder="bloch_sphere|three_body|custom"/>
                <Field label="Component ID" value={simForm.component_id} onChange={sf('component_id')} placeholder="quantum|threebody|your-key"/>
                <TextArea label="Key Insights" value={simForm.insights} onChange={sf('insights')} rows={4} hint="One per line."/>
                <Field label="Tags (comma-separated)" value={simForm.tags} onChange={sf('tags')}/>
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Preview Snapshot</p>
                  <input type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{if(typeof r.result==='string')setSnapshotB64(r.result);};r.readAsDataURL(f);}}
                    className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"/>
                  {snapshotB64&&<img src={snapshotB64} alt="Preview" className="w-full rounded-md object-cover" style={{maxHeight:120}}/>}
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">3-D File (.glb/.gltf)</p>
                  <input type="file" accept=".glb,.gltf,.obj,.fbx,.stl" onChange={e=>setGlbFile(e.target.files?.[0]??null)}
                    className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"/>
                  {glbFile&&<p className="text-[11px] text-steami-green">Selected: {glbFile.name}</p>}
                </div>
              </>}



              {tab==='intelligence'&&<>
                <Field label="ID" value={intelForm.id} onChange={nf('id')} required disabled={!!editingId} placeholder="e.g. node-001"/>
                <Field label="Article ID" value={intelForm.article_id} onChange={nf('article_id')} required placeholder="Source article identifier"/>
                <Field label="Title" value={intelForm.title} onChange={nf('title')} required/>
                <Field label="Topic" value={intelForm.topic} onChange={nf('topic')} placeholder="e.g. QUANTUM PHYSICS"/>
                <Field label="Source" value={intelForm.source} onChange={nf('source')} placeholder="e.g. Nature, MIT News"/>
                <Field label="Article URL" value={intelForm.article_url} onChange={nf('article_url')} placeholder="https://..."/>
                <Field label="Matched Domains (comma-separated)" value={intelForm.matched_domains} onChange={nf('matched_domains')} placeholder="PHYSICS, AI"/>
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">AI Insight Block</p>
                  <TextArea label="Summary" value={intelForm.ai_summary} onChange={nf('ai_summary')} rows={3}/>
                  <TextArea label="Key Points" value={intelForm.ai_key_points} onChange={nf('ai_key_points')} rows={3} hint="One per line."/>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">Sentiment</label>
                      <select value={intelForm.ai_sentiment} onChange={e=>nf('ai_sentiment')(e.target.value)}
                        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]">
                        <option value="positive">Positive</option>
                        <option value="negative">Negative</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">Sentiment Label</label>
                      <select value={intelForm.ai_sentiment_label} onChange={e=>nf('ai_sentiment_label')(e.target.value)}
                        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]">
                        <option value="good_news">Good News</option>
                        <option value="bad_news">Bad News</option>
                        <option value="neutral_news">Neutral News</option>
                      </select>
                    </div>
                  </div>
                  <Field label="Emoji" value={intelForm.ai_emoji} onChange={nf('ai_emoji')} placeholder="⚛️"/>
                  <Field label="Confidence (0–1)" value={intelForm.ai_confidence} onChange={nf('ai_confidence')} placeholder="0.92"/>
                  <Field label="Tags (comma-separated)" value={intelForm.ai_tags} onChange={nf('ai_tags')} placeholder="quantum, computing"/>
                  <Field label="Domain" value={intelForm.ai_domain} onChange={nf('ai_domain')} placeholder="QUANTUM PHYSICS"/>
                  <Field label="Reading Time (min)" value={intelForm.ai_reading_time_min} onChange={nf('ai_reading_time_min')} placeholder="4"/>
                  <Field label="AI Article URL" value={intelForm.ai_article_url} onChange={nf('ai_article_url')} placeholder="https://..."/>
                </div>
              </>}

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
