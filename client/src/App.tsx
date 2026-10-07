import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation, Link } from 'react-router-dom';
import './index.css';
import Icon from './components/Icon';

import Home from './pages/Home';
import MyOrders from './pages/MyOrders';
import RequestReturn from './pages/RequestReturn';
import AdminDashboard from './pages/AdminDashboard';
import AdminReview from './pages/AdminReview';

const navigation = [
  { to: '/', label: 'Storefront', icon: 'grid' as const, end: true },
  { to: '/orders', label: 'My orders', icon: 'bag' as const },
  { to: '/admin', label: 'Review queue', icon: 'shield' as const },
];

function Workspace() {
  const [dark, setDark] = useState(() => localStorage.getItem('resolvex-theme') === 'dark');
  const location = useLocation();
  const page = location.pathname.startsWith('/admin/review') ? 'Case review'
    : location.pathname.startsWith('/admin') ? 'Review queue'
    : location.pathname.startsWith('/return') ? 'Return request'
    : location.pathname.startsWith('/orders') ? 'My orders' : 'Storefront';

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('resolvex-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="workspace-shell">
      <aside className="sidebar">
        <Link to="/" className="brand-lockup">
          <span className="brand-mark"><Icon name="spark" size={20} /></span>
          <span><strong>ResolveX</strong><small>Returns workspace</small></span>
        </Link>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <Icon name={item.icon} size={18} /><span>{item.label}</span>
            {item.to === '/admin' && <span className="nav-dot" />}
          </NavLink>)}
        </nav>

        <div className="sidebar-section-label sidebar-lower-label">PREFERENCES</div>
        <button className="side-link theme-control" onClick={() => setDark(value => !value)}>
          <Icon name={dark ? 'sun' : 'moon'} size={18} />
          <span>{dark ? 'Light appearance' : 'Dark appearance'}</span>
        </button>

        <div className="sidebar-bottom">
          <div className="user-avatar">RX</div>
          <div className="user-meta"><strong>Demo workspace</strong><small>Customer portal</small></div>
          <button className="icon-button" aria-label="Settings"><Icon name="settings" /></button>
        </div>
      </aside>

      <div className="workspace-center">
        <header className="topbar">
          <div className="topbar-title"><span className="eyebrow">RESOLVEX / WORKSPACE</span><strong>{page}</strong></div>
          <div className="topbar-actions"><span className="system-status"><i /> All systems ready</span><button className="help-button"><span>?</span> Help</button></div>
        </header>
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/return/:orderId" element={<RequestReturn />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/review/:reviewId" element={<AdminReview />} />
          </Routes>
        </main>
      </div>

      <aside className="context-rail">
        <div className="context-head"><span className="eyebrow">AT A GLANCE</span><button className="icon-button" aria-label="More options">···</button></div>
        <section className="rail-card policy-card">
          <div className="rail-icon"><Icon name="shield" size={17} /></div>
          <div><strong>Return policy</strong><p>Clear rules. Fair outcomes.</p></div>
          <div className="rail-divider" />
          <div className="policy-fact"><span>Standard window</span><strong>30 days</strong></div>
          <div className="policy-fact"><span>Defect evidence</span><strong>Photo required</strong></div>
          <div className="policy-fact"><span>Uncertain cases</span><strong>Human review</strong></div>
        </section>

        <section className="context-section">
          <div className="section-heading"><strong>Decision flow</strong><span className="muted-count">V1</span></div>
          <div className="flow-list">
            <div className="flow-row"><span className="flow-step done"><Icon name="check" size={13} /></span><div><strong>Request received</strong><small>Order details collected</small></div></div>
            <div className="flow-row"><span className="flow-step"><Icon name="receipt" size={13} /></span><div><strong>Policy evaluation</strong><small>Eligibility and evidence</small></div></div>
            <div className="flow-row"><span className="flow-step"><Icon name="shield" size={13} /></span><div><strong>Decision</strong><small>Auto or human review</small></div></div>
          </div>
        </section>

        <section className="rail-note"><div className="note-spark"><Icon name="spark" size={15} /></div><div><strong>Designed for clarity</strong><p>Every decision includes the policy checks and reasons behind it.</p></div></section>
        <div className="rail-footer">ResolveX <span>•</span> Returns decision engine</div>
      </aside>
    </div>
  );
}

function App() {
  return <BrowserRouter><Workspace /></BrowserRouter>;
}

export default App;
