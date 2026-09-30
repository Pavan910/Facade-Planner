import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defaultDesigns, defaultRates, regionsFromTemplate, uid } from './lib/catalog.js';
import { detectRegions } from './lib/detect.js';
import { pixelsPerFoot, regionLabels, totals } from './lib/estimate.js';
import { analyze, buildShade, loadImg, readFile, resize, sampleHouse } from './lib/image.js';
import { Renderer } from './lib/render.js';
import * as store from './lib/storage.js';
import Stage from './components/Stage.jsx';
import Variations from './components/Variations.jsx';
import UploadStep from './components/UploadStep.jsx';
import StructureStep from './components/StructureStep.jsx';
import MaterialsStep from './components/MaterialsStep.jsx';
import AreasStep from './components/AreasStep.jsx';
import CostStep from './components/CostStep.jsx';
import ReportStep from './components/ReportStep.jsx';
import DocsView from './components/DocsView.jsx';
import ProjectsModal from './components/ProjectsModal.jsx';

const STEP_NAMES = ['Upload', 'Structure', 'Materials', 'Areas & quantities', 'Cost', 'Report'];
const DEFAULT_SETTINGS = { gst: false, pillarFaces: 3, showOutlines: false };

function useFlash() {
  const [msg, setMsg] = useState('');
  const timer = useRef();
  const flash = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 4000);
  }, []);
  return [msg, flash];
}

export default function App() {
  const [view, setView] = useState('planner');
  const [step, setStep] = useState(1);
  const [uploads, setUploads] = useState([]);
  const [activeUpload, setActiveUpload] = useState(null);
  const [img, setImg] = useState(null); // { src, w, h }
  const [renderer, setRenderer] = useState(null);
  const [regions, setRegions] = useState([]);
  const [sel, setSel] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [active, setActive] = useState(0);
  const [rates, setRates] = useState(defaultRates);
  const [scale, setScale] = useState({ mode: 'window', refFt: 4 });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [compare, setCompare] = useState(50);
  const [thumbs, setThumbs] = useState({});
  const [detecting, setDetecting] = useState(false);
  const [detection, setDetection] = useState(null);
  const [projectName, setProjectName] = useState('My house exterior');
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState(() => store.listProjects());
  const [showProjects, setShowProjects] = useState(false);
  const [msg, flash] = useFlash();
  const loadToken = useRef(0);

  const refreshProjects = () => setProjects(store.listProjects());

  const design = designs[active];
  const ppf = useMemo(() => pixelsPerFoot(regions, scale.mode, scale.refFt, img?.w), [regions, scale, img]);
  const ctx = useMemo(() => ({ regions, rates, ppf, pillarFaces: settings.pillarFaces }), [regions, rates, ppf, settings.pillarFaces]);
  const t = useMemo(() => totals(design, ctx, settings.gst), [design, ctx, settings.gst]);
  const labels = useMemo(() => regionLabels(regions), [regions]);
  const grandFor = useCallback((d) => totals(d, ctx, settings.gst).grand, [ctx, settings.gst]);

  // Variation thumbnails, debounced so dragging and rate edits stay smooth.
  useEffect(() => {
    if (!renderer || step < 3 || detecting) return;
    const id = setTimeout(() => {
      const next = {};
      designs.forEach((d) => { next[d.id] = renderer.toDataURL(d, regions, ppf, 300, 0.8); });
      setThumbs(next);
    }, 250);
    return () => clearTimeout(id);
  }, [renderer, designs, regions, ppf, step, detecting]);

  // ---------- Upload & detection ----------
  async function selectUpload(u, saved) {
    const token = ++loadToken.current;
    const image = await loadImg(u.src);
    if (token !== loadToken.current) return;
    setRenderer(new Renderer(image, buildShade(image)));
    setImg({ src: u.src, w: image.width, h: image.height });
    setActiveUpload(u.id);
    setSel(null);
    setThumbs({});

    if (saved) {
      setRegions(saved.regions);
      setDesigns(saved.designs);
      setActive(saved.active || 0);
      setRates({ ...defaultRates(), ...saved.rates });
      setScale(saved.scale || { mode: 'window', refFt: 4 });
      setSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
      setDetection(saved.detection || null);
      setDetecting(false);
      setStep(saved.step || 3);
      return;
    }

    setRegions([]);
    setDesigns([]);
    setDetecting(true);
    const det = await detectRegions(u.src, image.width, image.height);
    if (token !== loadToken.current) return;
    setRegions(det.regions);
    setDesigns(defaultDesigns(det.regions));
    setActive(0);
    setScale({ mode: 'window', refFt: 4 });
    setDetection(det);
    setDetecting(false);
    setStep(2);
  }

  async function addFiles(files) {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    if (!list.length) { flash('Please choose image files (JPG or PNG).'); return; }
    const added = [];
    for (const f of list) {
      try {
        const n = await resize(await readFile(f));
        added.push({ id: uid('u'), name: f.name, src: n.src, q: analyze(n.img, n.ow, n.oh) });
      } catch {
        added.push({ id: uid('u'), name: f.name, src: '', q: { status: 'Rejected', issues: ['File could not be read as an image.'], score: 0, metrics: '' } });
      }
    }
    setUploads((prev) => [...prev, ...added]);
    const best = added.filter((u) => u.q.status !== 'Rejected').sort((a, b) => b.q.score - a.q.score)[0];
    if (best) selectUpload(best);
    else flash('None of the photos are usable. See the notes under each photo.');
  }

  async function onSample() {
    const n = await resize(sampleHouse());
    const u = { id: uid('u'), name: 'sample-house.jpg', src: n.src, q: analyze(n.img, n.ow, n.oh) };
    setUploads((prev) => [...prev, u]);
    selectUpload(u);
  }

  // ---------- Navigation ----------
  function goStep(n) {
    if (n > 1 && !img) return;
    if (detecting && n > 1) return;
    if (n === 3) {
      const r = regions.find((x) => x.id === sel);
      if (!r || r.type === 'window') setSel((regions.find((x) => x.type === 'wall') || {}).id || null);
    }
    setStep(n);
    setView('planner');
  }
  const next = () => goStep(Math.min(6, step + 1));

  // ---------- Designs ----------
  const updateDesign = (fn) => setDesigns((ds) => ds.map((d, i) => (i === active ? fn(d) : d)));

  function resetDetection() {
    const rs = regionsFromTemplate(img.w, img.h);
    setRegions(rs);
    setDesigns(defaultDesigns(rs));
    setActive(0);
    setSel(null);
    setDetection({ source: 'template', note: 'Standard layout placed. Drag the boxes onto your house.' });
  }

  async function rerunAI() {
    const u = uploads.find((x) => x.id === activeUpload);
    if (u) selectUpload(u);
  }

  // ---------- Projects ----------
  async function save() {
    if (!img || !renderer) { flash('Upload a photo before saving.'); return; }
    const small = await resize(img.src, 1100, 0.82);
    const k = small.img.width / img.w;
    const id = projectId || uid('p');
    const project = {
      id,
      name: projectName,
      date: new Date().toISOString(),
      src: small.src,
      thumb: design ? renderer.toDataURL(design, regions, ppf, 240, 0.75) : '',
      regions: regions.map((r) => ({ ...r, x: r.x * k, y: r.y * k, w: r.w * k, h: r.h * k })),
      designs,
      active,
      rates,
      scale,
      settings,
      detection: detection && { source: detection.source, note: detection.note },
      step: Math.max(3, step),
    };
    try {
      store.saveProject(project);
      setProjectId(id);
      refreshProjects();
      flash('Project saved in this browser.');
    } catch (e) {
      flash('Could not save: ' + e.message);
    }
  }

  async function openProject(id) {
    try {
      const p = store.loadProject(id);
      if (!p) throw new Error('not found');
      const u = { id: uid('u'), name: p.name + '.jpg', src: p.src, q: { status: 'Good', issues: [], score: 0, metrics: 'Saved project' } };
      setUploads([u]);
      setShowProjects(false);
      setProjectId(p.id);
      setProjectName(p.name);
      setView('planner');
      selectUpload(u, p);
    } catch (e) {
      flash('Could not open project: ' + e.message);
    }
  }

  async function removeProject(id) {
    store.deleteProject(id);
    if (id === projectId) setProjectId(null);
    refreshProjects();
  }

  const hasImg = !!img;
  const common = { regions, setRegions, sel, setSel, labels, design, updateDesign, ppf, settings, setSettings, next };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="header">
        <div className="brand"><div className="logo" />Facade Planner<span className="badge">PROTOTYPE</span></div>
        <nav className="tabs">
          <button className={view === 'planner' ? 'on' : ''} onClick={() => setView('planner')}>Planner</button>
          <button className={view === 'docs' ? 'on' : ''} onClick={() => setView('docs')}>Documentation</button>
        </nav>
        <div className="spacer" />
        <input className="input" style={{ width: 200, padding: '7px 10px' }} value={projectName} onChange={(e) => setProjectName(e.target.value)} aria-label="Project name" />
        <button className="btn" onClick={() => { refreshProjects(); setShowProjects(true); }}>Projects ({projects.length})</button>
        <button className="btn btn-dark" onClick={save}>Save project</button>
      </header>

      {msg && <div className="toast" role="status">{msg}</div>}

      {view === 'planner' && (
        <>
          <div className="steps">
            {STEP_NAMES.map((label, i) => {
              const n = i + 1;
              const cls = 'step' + (n === step ? ' on' : n < step && hasImg ? ' done' : '');
              return (
                <button key={n} className={cls} disabled={n > 1 && (!hasImg || detecting)} onClick={() => goStep(n)}>
                  <span className="n">{n}</span>{label}
                </button>
              );
            })}
          </div>

          <main className="main">
            <section className="left">
              <Stage
                img={img}
                renderer={renderer}
                regions={regions}
                setRegions={setRegions}
                sel={sel}
                setSel={setSel}
                labels={labels}
                step={step}
                design={design}
                ppf={ppf}
                detecting={detecting}
                compare={compare}
                setCompare={setCompare}
                showOutlines={settings.showOutlines}
                setShowOutlines={(v) => setSettings((s) => ({ ...s, showOutlines: v }))}
              />
              {hasImg && step >= 3 && !detecting && (
                <Variations
                  designs={designs}
                  active={active}
                  setActive={setActive}
                  thumbs={thumbs}
                  grandFor={grandFor}
                  onAdd={() => {
                    setDesigns((ds) => [...ds, { id: uid('d'), name: 'Variation ' + (ds.length + 1), assign: { ...(design ? design.assign : {}) } }]);
                    setActive(designs.length);
                  }}
                  onDelete={(i) => {
                    if (designs.length < 2) return;
                    setDesigns((ds) => ds.filter((_, j) => j !== i));
                    setActive((a) => (a >= i && a > 0 ? a - 1 : a));
                  }}
                />
              )}
            </section>

            <aside className="panel">
              {step === 1 && (
                <UploadStep uploads={uploads} activeUpload={activeUpload} addFiles={addFiles} onSample={onSample} onUse={(u) => selectUpload(u)} hasImg={hasImg} detecting={detecting} next={next} />
              )}
              {step === 2 && hasImg && (
                <StructureStep {...common} img={img} detection={detection} detecting={detecting} onReset={resetDetection} onRerunAI={rerunAI} />
              )}
              {step === 3 && hasImg && <MaterialsStep {...common} rates={rates} />}
              {step === 4 && hasImg && <AreasStep {...common} scale={scale} setScale={setScale} t={t} />}
              {step === 5 && hasImg && <CostStep {...common} rates={rates} setRates={setRates} t={t} />}
              {step === 6 && hasImg && (
                <ReportStep
                  projectName={projectName}
                  img={img}
                  renderer={renderer}
                  designs={designs}
                  design={design}
                  regions={regions}
                  ppf={ppf}
                  t={t}
                  grandFor={grandFor}
                  rates={rates}
                  scale={scale}
                  settings={settings}
                  detection={detection}
                  onSave={save}
                  flash={flash}
                />
              )}
            </aside>
          </main>
        </>
      )}

      {view === 'docs' && <DocsView />}

      {showProjects && (
        <ProjectsModal
          projects={projects}
          onOpen={openProject}
          onDelete={removeProject}
          onClose={() => setShowProjects(false)}
        />
      )}
    </div>
  );
}
