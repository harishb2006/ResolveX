import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import PolicyCheckPath from '../components/PolicyCheckPath';
import RiskBreakdown from '../components/RiskBreakdown';
import AIAnalysisCard from '../components/AIAnalysisCard';

export default function AdminReview() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState<any>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/returns/admin/${reviewId}`)
      .then(res => res.json())
      .then(data => setReview(data))
      .catch(() => setError('Could not load this review.'));
  }, [reviewId]);

  const handleDecision = async (status: string) => {
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:8000/returns/admin/${reviewId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Could not save decision');
      navigate('/admin');
    } catch (e) {
      console.error(e);
      alert('Failed to save decision');
    } finally {
      setSaving(false);
    }
  };

  if (!review) return <div role={error ? 'alert' : undefined} className={`text-center py-20 ${error ? 'text-red-600' : 'text-gray-500'}`}>{error || 'Loading case details...'}</div>;

  return <div className="admin-review-page animate-in fade-in zoom-in-95 duration-300">
    <button onClick={() => navigate('/admin')} className="back-link"><Icon name="arrow" size={14} /> Back to review queue</button>
    <div className="page-heading page-heading-row"><div><span className="eyebrow">CASE {review.id} / MANUAL REVIEW</span><h1>Review return request</h1><p>Inspect the evidence and policy evaluation, then record your decision.</p></div><span className="status-pill status-warning"><Icon name="clock" size={12} /> Pending review</span></div>

    <div className="review-detail-grid">
      <div className="review-detail-main">
        <section className="detail-panel">
          <div className="panel-title"><span className="panel-title-icon"><Icon name="receipt" /></span><div><strong>Request details</strong><small>Order and customer-provided information</small></div></div>
          <div className="detail-pairs"><div><span>ORDER</span><strong className="mono-id">{review.order_id}</strong></div><div><span>PRODUCT</span><strong>{review.product_name}</strong></div><div><span>REASON</span><strong>{review.reason}</strong></div><div><span>ITEM VALUE</span><strong>{review.price}</strong></div></div>
          <div className="detail-description"><span className="subtle-label">CUSTOMER DESCRIPTION</span><p>{review.description || 'No additional description supplied.'}</p></div>
          {review.evidence?.length > 0 && <div className="evidence-block"><span className="subtle-label">ATTACHED EVIDENCE</span>{review.evidence[0]?.startsWith('data:image/') ? <img src={review.evidence[0]} alt="Customer return evidence" /> : <div className="evidence-missing"><Icon name="box" /> Evidence preview unavailable</div>}</div>}
        </section>

        <AIAnalysisCard analysis={review.ai_analysis} />

        <section className="detail-panel policy-review-panel">
          <div className="panel-title"><span className="panel-title-icon violet"><Icon name="shield" /></span><div><strong>Policy evaluation</strong><small>Connected path through the return rules</small></div><span className="status-pill status-info">{review.policy_checks?.filter((check: any) => check.passed).length || 0} / {review.policy_checks?.length || 0} passed</span></div>
          <PolicyCheckPath checks={review.policy_checks || []} />
          {review.reasons?.length > 0 && <div className="review-rationale"><span className="subtle-label">WHY THIS CASE WAS FLAGGED</span>{review.reasons.map((reason: string, index: number) => <p key={index}><Icon name="spark" size={13} />{reason}</p>)}</div>}
        </section>
      </div>

      <aside className="review-detail-side">
        <section className="detail-panel confidence-panel"><span className="subtle-label">DECISION SIGNALS</span><div className="signal-row"><span>Decision confidence</span><strong>{(review.confidence * 100).toFixed(0)}%</strong></div><div className="signal-meter"><i style={{ width: `${review.confidence * 100}%` }} /></div></section>
        <RiskBreakdown score={review.risk_score} level={review.risk_level || 'LOW'} threshold={review.risk_threshold ?? 0.6} factors={review.risk_factors || []} />
        <section className="detail-panel decision-panel"><div className="panel-title"><span className="panel-title-icon violet"><Icon name="check" /></span><div><strong>Record a decision</strong><small>This closes the pending case.</small></div></div><div className="decision-actions"><button disabled={saving} onClick={() => handleDecision('APPROVED_REFUND')} className="decision-action approve"><Icon name="check" size={16} /><span><strong>Approve refund</strong><small>Accept the return</small></span><Icon name="arrow" size={14} /></button><button disabled={saving} onClick={() => handleDecision('APPROVED_REPLACE')} className="decision-action replace"><Icon name="box" size={16} /><span><strong>Approve replacement</strong><small>Send another item</small></span><Icon name="arrow" size={14} /></button><button disabled={saving} onClick={() => handleDecision('WARRANTY_SERVICE')} className="decision-action warranty"><Icon name="shield" size={16} /><span><strong>Warranty service</strong><small>Route for repair</small></span><Icon name="arrow" size={14} /></button><button disabled={saving} onClick={() => handleDecision('REJECTED')} className="decision-action reject"><Icon name="box" size={16} /><span><strong>Reject request</strong><small>Explain the policy outcome</small></span><Icon name="arrow" size={14} /></button></div>{saving && <div className="saving-note"><span className="mini-spinner" /> Saving decision…</div>}</section>
      </aside>
    </div>
  </div>;
}
