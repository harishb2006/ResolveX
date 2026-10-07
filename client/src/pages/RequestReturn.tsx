import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import PolicyCheckPath from '../components/PolicyCheckPath';
import RiskBreakdown from '../components/RiskBreakdown';
import AIAnalysisCard from '../components/AIAnalysisCard';

const REASONS = [
  "Product is defective",
  "Product arrived damaged",
  "Wrong product received",
  "Doesn't match description",
  "Size doesn't fit",
  "Changed my mind",
  "Other"
];

export default function RequestReturn() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<any>(null);
  const [evidenceName, setEvidenceName] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/returns/orders')
      .then(async response => {
        if (!response.ok) throw new Error('Could not load order');
        const orders = await response.json();
        setOrder(orders.find((o: any) => o.orderId === orderId) ?? { notFound: true });
      })
      .catch(() => setOrder({ loadError: true }));
  }, [orderId]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/returns/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          reason,
          description,
          evidence
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to submit return request');
      setDecision(data);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to submit return request.");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <div className="text-center py-12 text-gray-500">Loading order...</div>;
  if (order.loadError) return <div role="alert" className="text-center py-12 text-red-600">Could not load this order. Check the API connection.</div>;
  if (order.notFound) return <div role="alert" className="empty-state"><Icon name="box" size={28} /><p>We couldn't find that order.</p><Link to="/orders" className="primary-button">Back to my orders</Link></div>;

  if (decision) {
    const checks = decision.policy_checks || [];
    const passedChecks = checks.filter((check: any) => check.passed).length;
    const progress = checks.length ? `${(passedChecks / checks.length) * 100}%` : '0%';
    return (
      <div className="return-workspace animate-in fade-in zoom-in duration-500">
        <div className="page-heading"><span className="eyebrow">REQUEST {decision.id}</span><h1>Return review</h1><p>Here’s what the policy engine checked for {order.productName}.</p></div>
        <div className="decision-banner">
          <div className={`decision-mark ${decision.decision === 'REJECT' ? 'danger' : decision.decision === 'MANUAL_REVIEW' ? 'pending' : 'success'}`}>
            <Icon name={decision.decision === 'REJECT' ? 'box' : decision.decision === 'MANUAL_REVIEW' ? 'clock' : 'check'} size={20} />
          </div>
          <div className="decision-copy"><span className="eyebrow">RECOMMENDED OUTCOME</span><h2>{decision.decision.replaceAll('_', ' ')}</h2><p>{decision.decision === 'MANUAL_REVIEW' ? 'A reviewer will look at the request and its evidence.' : decision.decision === 'REJECT' ? 'One or more eligibility rules were not met.' : decision.decision === 'WARRANTY_SERVICE' ? 'This issue qualifies for the product warranty.' : 'The request meets the automatic approval criteria.'}</p></div>
          <span className={`status-pill ${decision.decision === 'REJECT' ? 'status-danger' : decision.decision === 'MANUAL_REVIEW' ? 'status-warning' : 'status-success'}`}><Icon name={decision.decision === 'MANUAL_REVIEW' ? 'clock' : 'check'} size={12} />{decision.decision === 'MANUAL_REVIEW' ? 'Needs review' : decision.decision === 'REJECT' ? 'Not eligible' : 'Evaluated'}</span>
        </div>

        <div className="decision-metrics">
          <div className="metric-card"><span className="metric-label">Decision confidence</span><div className="metric-value">{(decision.confidence * 100).toFixed(0)}<small>%</small></div><div className="metric-meter"><i style={{ width: `${decision.confidence * 100}%` }} /></div></div>
          <div className="metric-card"><span className="metric-label">Policy checks passed</span><div className="metric-value">{passedChecks}<small> / {checks.length}</small></div><div className="metric-meter"><i style={{ width: progress }} /></div></div>
          <div className="metric-card"><span className="metric-label">Risk indicator</span><div className="metric-value">{(decision.risk_score * 100).toFixed(0)}<small>%</small></div><div className="metric-meter risk-meter"><i style={{ width: `${decision.risk_score * 100}%` }} /></div></div>
        </div>

        <RiskBreakdown score={decision.risk_score} level={decision.risk_level || 'LOW'} threshold={decision.risk_threshold ?? 0.6} factors={decision.risk_factors || []} />
        <AIAnalysisCard analysis={decision.ai_analysis} />

        <section className="policy-panel">
          <div className="policy-panel-head"><div><span className="eyebrow">ELIGIBILITY WALKTHROUGH</span><h3>Policy checks</h3><p>Each checkpoint contributes to the final outcome.</p></div><span className="policy-counter">{passedChecks} of {checks.length} passed</span></div>
          <PolicyCheckPath checks={checks} />
        </section>

        <section className="reason-panel"><div className="reason-title"><span className="reason-spark"><Icon name="spark" size={15} /></span><strong>Decision rationale</strong></div><ul>{decision.reasons.map((item: string, index: number) => <li key={index}>{item}</li>)}</ul></section>
        <Link to="/orders" className="soft-button"><Icon name="arrow" size={14} /> Return to my orders</Link>
      </div>
    );
  }

  return (
    <div className="return-workspace animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-heading"><span className="eyebrow">ORDER {order.orderId}</span><h1>Start a return</h1><p>Tell us what happened. We’ll check your request against the return policy.</p></div>
      <div className="return-product-card"><div className="order-product-icon"><Icon name="box" size={22} /></div><div className="order-product-copy"><span className="eyebrow">ITEM IN THIS ORDER</span><strong>{order.productName}</strong><small>{order.orderId} <span>·</span> {order.price}</small></div><span className="status-pill status-success">{order.status}</span></div>

      <section className="form-panel">
        <div className="form-panel-heading"><div className="form-step-number">01</div><div><strong>Reason for return</strong><small>Choose the option that best describes your issue.</small></div></div>
        <div className="reason-grid">
          {REASONS.map((r, i) => (
            <label key={r} className={`reason-option ${reason === r ? 'selected' : ''}`}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={(e) => setReason(e.target.value)} />
              <span className="reason-radio" />
              <span>{r}</span>
              {i === 0 && <Icon name="arrow" size={14} className="reason-arrow" />}
            </label>
          ))}
        </div>

        <label className="form-label" htmlFor="return-description">Tell us a little more <span>REQUIRED</span></label>
        <textarea id="return-description" maxLength={1200} value={description} onChange={(e) => setDescription(e.target.value)} className="field-control description-field" placeholder="For example, describe when the issue started or what was different from what you expected." />

        <div className="upload-row"><div><strong>Photo evidence</strong><small>For damaged, defective, or incorrect items. Up to 2 MB.</small></div>
          <label className="upload-button"><Icon name={evidence.length ? 'check' : 'plus'} size={15} />{evidence.length ? 'Image added' : 'Add image'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { alert('Choose a JPEG, PNG, or WebP image.'); event.target.value = ''; return; }
            if (file.size > 2 * 1024 * 1024) { alert('Choose an image smaller than 2 MB.'); event.target.value = ''; return; }
            const reader = new FileReader();
            reader.onload = () => { setEvidence(typeof reader.result === 'string' ? [reader.result] : []); setEvidenceName(file.name); };
            reader.readAsDataURL(file);
          }} /></label>
        </div>
        {evidence[0] && <div className="evidence-preview"><img src={evidence[0]} alt="Selected return evidence" /><div><strong>{evidenceName}</strong><small>Ready to attach to your request</small></div><button type="button" onClick={() => { setEvidence([]); setEvidenceName(''); }} className="remove-evidence">Remove</button></div>}

        <div className="form-submit-row"><small>We’ll evaluate this request using the policy checks shown in your decision.</small><button onClick={handleSubmit} disabled={!reason || !description.trim() || loading} className="primary-button">{loading ? <><span className="mini-spinner" /> Checking request</> : <>Review return request <Icon name="arrow" size={15} /></>}</button></div>
      </section>
    </div>
  );
}
