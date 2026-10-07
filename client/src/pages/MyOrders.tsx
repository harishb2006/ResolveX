import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/returns/orders')
      .then(async response => {
        if (!response.ok) throw new Error('Could not load orders');
        setOrders(await response.json());
      })
      .catch(() => setError('Could not load orders. Check that the API and database are running.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="orders-page animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-heading page-heading-row">
        <div><span className="eyebrow">CUSTOMER PORTAL</span><h1>My orders</h1><p>Order history and return requests in one place.</p></div>
        <button className="soft-button" onClick={() => navigate('/')}><Icon name="plus" size={14} /> Shop products</button>
      </div>
      {error && <p role="alert" className="inline-alert danger-alert">{error}</p>}
      <div className="order-summary-grid">
        <div className="metric-card"><span className="metric-icon"><Icon name="bag" /></span><span className="metric-label">Orders placed</span><div className="metric-value">{loading ? '—' : orders.length}</div></div>
        <div className="metric-card"><span className="metric-icon"><Icon name="clock" /></span><span className="metric-label">Open return cases</span><div className="metric-value">{loading ? '—' : orders.filter(order => order.returnStatus === 'REQUESTED').length}</div></div>
        <div className="metric-card"><span className="metric-icon"><Icon name="shield" /></span><span className="metric-label">Policy-first support</span><div className="metric-value metric-word">Always on</div></div>
      </div>

      <div className="section-heading orders-list-heading"><div><strong>Order history</strong><p className="muted-note">Your recent purchases and their return status.</p></div><span className="muted-count">{loading ? 'LOADING' : `${orders.length} ORDERS`}</span></div>
      {loading && <div className="empty-state"><span className="mini-spinner" /> Loading orders…</div>}
      {!loading && orders.length === 0 && <div className="empty-state"><span className="empty-icon"><Icon name="bag" size={25} /></span><strong>No orders yet</strong><p>Browse the storefront to create a sample order.</p><button className="primary-button" onClick={() => navigate('/')}>Explore products <Icon name="arrow" size={14} /></button></div>}
      <div className="order-list">{orders.map(order => (
        <article key={order.orderId} className="order-card">
          <div className="order-product-icon"><Icon name="box" size={21} /></div>
          <div className="order-card-main"><div className="order-card-title"><strong>{order.productName}</strong><span className="mono-id">{order.orderId}</span></div><div className="order-card-meta"><span>{order.price}</span><i /> <span>Ordered {order.purchaseDate ? new Date(order.purchaseDate).toLocaleDateString() : 'date unavailable'}</span></div></div>
          <span className={`status-pill ${order.returnStatus ? (order.returnStatus === 'REJECTED' ? 'status-danger' : order.returnStatus === 'REQUESTED' ? 'status-warning' : 'status-info') : 'status-success'}`}><i className="status-dot" />{order.returnStatus ? `Return ${order.returnStatus.toLowerCase()}` : 'Delivered'}</span>
          <button onClick={() => navigate(`/return/${order.orderId}`)} disabled={Boolean(order.returnStatus)} className="soft-button order-action">{order.returnStatus ? 'Request submitted' : 'Request return'} <Icon name="arrow" size={13} /></button>
        </article>
      ))}</div>
    </div>
  );
}
