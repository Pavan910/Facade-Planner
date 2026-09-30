import { MATERIALS, defaultRates } from '../lib/catalog.js';
import { money, qtyText } from '../lib/estimate.js';

export default function CostStep({ design, rates, setRates, settings, setSettings, t, next }) {
  const set = (id, f) => (e) => {
    const v = e.target.value;
    setRates((rs) => ({ ...rs, [id]: { ...rs[id], [f]: v === '' ? '' : Math.max(0, +v) } }));
  };

  return (
    <>
      <div>
        <h2>Cost estimate</h2>
        <p className="lede">Costs use the rates below. Edit any rate to match a local supplier or contractor quote; totals update immediately.</p>
      </div>

      <div>
        <div className="eyebrow">Rates (₹)</div>
        <div className="rates">
          <span className="muted">Material</span><span className="muted">Material / unit</span><span className="muted">Labour / basis</span><span className="muted">Waste %</span>
          {Object.entries(MATERIALS).map(([id, m]) => [
            <span key={id + 'n'} style={{ fontSize: 13, lineHeight: 1.3 }}>{m.name}</span>,
            <label key={id + 'r'}><input type="number" min="0" value={rates[id].rate} onChange={set(id, 'rate')} aria-label={`${m.name} material rate`} /><span>/{m.unit}</span></label>,
            <label key={id + 'l'}><input type="number" min="0" value={rates[id].labor} onChange={set(id, 'labor')} aria-label={`${m.name} labour rate`} /><span>/{m.basis}</span></label>,
            <input key={id + 'w'} type="number" min="0" value={rates[id].wastage} onChange={set(id, 'wastage')} aria-label={`${m.name} wastage percent`} />,
          ])}
        </div>
        <button className="link" style={{ marginTop: 8 }} onClick={() => setRates(defaultRates())}>Reset to default rates</button>
      </div>

      <div>
        <div className="eyebrow">Breakdown by category · {design?.name}</div>
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.5fr) 1fr 1fr 1fr', fontSize: 12 }}>
          <span className="h">Category</span><span className="h num">Material</span><span className="h num">Labour</span><span className="h num">Total</span>
          {t.cats.map((c) => [
            <span key={c.id + 'n'} style={{ fontSize: 13 }}>{c.name}<br /><span className="mono tiny muted">{qtyText(c.qty, c.unit)}</span></span>,
            <span key={c.id + 'm'} className="num">{money(c.mat)}</span>,
            <span key={c.id + 'l'} className="num">{money(c.lab)}</span>,
            <span key={c.id + 't'} className="num" style={{ fontWeight: 600 }}>{money(c.total)}</span>,
          ])}
        </div>
      </div>

      <div className="total">
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}><span>Material cost</span><span className="mono">{money(t.mat)}</span></div>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}><span>Labour cost</span><span className="mono">{money(t.lab)}</span></div>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
          <label className="check"><input type="checkbox" checked={settings.gst} onChange={(e) => setSettings((s) => ({ ...s, gst: e.target.checked }))} />Add GST 18%</label>
          <span className="mono">{settings.gst ? money(t.gst) : '–'}</span>
        </div>
        <div className="grand"><span style={{ fontWeight: 600 }}>Grand total</span><b>{money(t.grand)}</b></div>
      </div>
      <div className="tiny muted">Estimate is advisory and not a binding quotation. Scaffolding, surface repair and transport are not included.</div>
      <button className="btn-primary" onClick={next}>Create report</button>
    </>
  );
}
