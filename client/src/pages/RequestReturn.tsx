import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { apiFetch } from '../auth/AuthContext';

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
  const [desiredResolution, setDesiredResolution] = useState<'refund' | 'replacement'>('refund');
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<any>(null);
  const [evidenceName, setEvidenceName] = useState('');
  const evidenceRequired = ['Product is defective', 'Product arrived damaged', 'Wrong product received'].includes(reason);

  useEffect(() => {
    apiFetch('/returns/orders')
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
      const res = await apiFetch('/returns/', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          reason,
          desired_resolution: desiredResolution,
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
    const isRejected = decision.decision === 'REJECT';
    const needsReview = decision.decision === 'MANUAL_REVIEW' || decision.decision === 'WARRANTY_SERVICE';
    const statusLabel = isRejected ? 'Not approved' : needsReview ? 'Under review' : 'Request approved';
    return (
      <div className="return-workspace animate-in fade-in zoom-in duration-500">
        <div className="page-heading"><span className="eyebrow">REQUEST {decision.id}</span><h1>Request update</h1><p>We’ve reviewed your {order.productName} request.</p></div>
        <div className="decision-banner">
          <div className={`decision-mark ${isRejected ? 'danger' : needsReview ? 'pending' : 'success'}`}>
            <Icon name={isRejected ? 'box' : needsReview ? 'clock' : 'check'} size={20} />
          </div>
          <div className="decision-copy"><span className="eyebrow">{statusLabel.toUpperCase()}</span><h2>{decision.customer_message}</h2><p>{decision.next_step}</p></div>
          <span className={`status-pill ${isRejected ? 'status-danger' : needsReview ? 'status-warning' : 'status-success'}`}><Icon name={needsReview ? 'clock' : 'check'} size={12} />{statusLabel}</span>
        </div>
        <section className="customer-next-step"><span className="eyebrow">YOUR PREFERENCE</span><div><Icon name={desiredResolution === 'refund' ? 'receipt' : 'box'} size={17} /><strong>{desiredResolution === 'refund' ? 'Refund to original payment method' : 'Replacement item'}</strong></div></section>
        <Link to="/orders" className="soft-button"><Icon name="arrow" size={14} /> Return to my orders</Link>
      </div>
    );
  }

  return (
    <div className="return-workspace animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-heading"><span className="eyebrow">ORDER {order.orderId}</span><h1>Start a return</h1><p>Tell us what happened and choose a refund or replacement. We’ll check your request against the return policy.</p></div>
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

        <div className="resolution-question">
          <div className="form-panel-heading"><div className="form-step-number">02</div><div><strong>How would you like us to resolve this?</strong><small>Choose your preference. We’ll check whether it fits the return policy.</small></div></div>
          <div className="resolution-options">
            <label className={`resolution-choice ${desiredResolution === 'refund' ? 'selected' : ''}`}>
              <input type="radio" name="desired-resolution" value="refund" checked={desiredResolution === 'refund'} onChange={() => setDesiredResolution('refund')} />
              <span className="resolution-choice-icon"><Icon name="receipt" size={18} /></span><span><strong>Refund</strong><small>Return the item for a refund</small></span><span className="reason-radio" />
            </label>
            <label className={`resolution-choice ${desiredResolution === 'replacement' ? 'selected' : ''}`}>
              <input type="radio" name="desired-resolution" value="replacement" checked={desiredResolution === 'replacement'} onChange={() => setDesiredResolution('replacement')} />
              <span className="resolution-choice-icon"><Icon name="box" size={18} /></span><span><strong>Replacement</strong><small>Receive the same item again</small></span><span className="reason-radio" />
            </label>
          </div>
        </div>

        <label className="form-label" htmlFor="return-description">What happened? <span>REQUIRED</span></label>
        <textarea id="return-description" maxLength={1200} value={description} onChange={(e) => setDescription(e.target.value)} className="field-control description-field" placeholder="For example, describe when the issue started or what was different from what you expected." />

        <div className="upload-row"><div><strong>Photo evidence{evidenceRequired ? ' · required' : ' · optional'}</strong><small>{evidenceRequired ? 'Add a photo for this issue. JPEG, PNG, or WebP up to 2 MB.' : 'A photo can help us understand the issue. JPEG, PNG, or WebP up to 2 MB.'}</small></div>
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

        <div className="form-submit-row"><small>We’ll check your preference against the return policy and update you here.</small><button onClick={handleSubmit} disabled={!reason || !description.trim() || (evidenceRequired && !evidence.length) || loading} className="primary-button">{loading ? <><span className="mini-spinner" /> Checking request</> : <>Submit return request <Icon name="arrow" size={15} /></>}</button></div>
      </section>
    </div>
  );
}
