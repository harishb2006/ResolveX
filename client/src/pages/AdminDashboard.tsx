import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

export default function AdminDashboard() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/returns/admin")
      .then(res => { if (!res.ok) throw new Error('Could not load the review queue'); return res.json(); })
      .then(data => setReviews(data))
      .catch(() => setError('Could not connect to the review queue. Check that the API is running.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-heading page-heading-row">
        <div><span className="eyebrow">OPERATIONS / HUMAN REVIEW</span><h1>Review queue</h1><p>Resolve requests that need a human decision.</p></div>
        <span className="queue-status"><i /> Live queue</span>
      </div>

      <div className="admin-metrics">
        <div className="metric-card"><span className="metric-icon"><Icon name="clock" /></span><span className="metric-label">Waiting for review</span><div className="metric-value">{loading ? '—' : reviews.length}</div></div>
        <div className="metric-card"><span className="metric-icon"><Icon name="shield" /></span><span className="metric-label">Queue type</span><div className="metric-value metric-word">Policy exceptions</div></div>
        <div className="metric-card"><span className="metric-icon"><Icon name="receipt" /></span><span className="metric-label">Review approach</span><div className="metric-value metric-word">Human in loop</div></div>
      </div>

      <div className="section-heading queue-heading"><div><strong>Cases to review</strong><p className="muted-note">Check the policy path and evidence before deciding.</p></div><span className="muted-count">{reviews.length} OPEN</span></div>
      {error && <p role="alert" className="inline-alert danger-alert">{error}</p>}
      {loading && <div className="empty-state"><span className="mini-spinner" /> Loading review cases…</div>}
      {!loading && !error && reviews.length === 0 && <div className="empty-state"><span className="empty-icon"><Icon name="shield" size={25} /></span><strong>You're all caught up</strong><p>New cases that need a human decision will show up here.</p></div>}
      <div className="review-list">{reviews.map(review => (
        <article key={review.id} className="review-card">
          <div className="review-priority-icon"><Icon name="receipt" size={18} /></div>
          <div className="review-card-main"><div className="review-title"><strong>{review.product_name}</strong><span className="mono-id">CASE {review.id}</span></div><p>{review.reason} <span>·</span> {review.order_id}</p><div className="review-card-tags"><span className="status-pill status-warning"><Icon name="clock" size={11} /> Pending</span><span>Risk {(review.risk_score * 100).toFixed(0)}%</span><span>Confidence {(review.confidence * 100).toFixed(0)}%</span></div></div>
          <button onClick={() => navigate(`/admin/review/${review.id}`)} className="primary-button">Open case <Icon name="arrow" size={14} /></button>
        </article>
      ))}</div>
    </div>
  );
}
