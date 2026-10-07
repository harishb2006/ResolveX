import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

const PRODUCTS = [
  { id: 'p1', name: 'MacBook Pro M3', price: 145000, image: 'laptop' as const, category: 'Computers', tint: 'violet' },
  { id: 'p2', name: 'Sony WH-1000XM5', price: 28999, image: 'headphones' as const, category: 'Audio', tint: 'blue' },
  { id: 'p3', name: 'Samsung Galaxy S24', price: 75000, image: 'phone' as const, category: 'Mobile', tint: 'green' },
  { id: 'p4', name: 'Nike Air Force 1', price: 7499, image: 'shoe' as const, category: 'Footwear', tint: 'amber' },
];

export default function Home() {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [buyingId, setBuyingId] = useState('');

  const handleBuy = async (product: typeof PRODUCTS[number]) => {
    setError('');
    setBuyingId(product.id);
    try {
      const response = await fetch('http://localhost:8000/returns/orders/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: product.name, price: product.price })
      });
      if (!response.ok) throw new Error('Could not create order');
      navigate('/orders');
    } catch {
      setError('Could not connect to the server. Start the API and database, then try again.');
    } finally {
      setBuyingId('');
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-heading page-heading-row">
        <div><span className="eyebrow">WELCOME BACK</span><h1>Thoughtful shopping,<br />straightforward returns.</h1><p>Explore the demo store and see how each return decision is made.</p></div>
        <div className="store-feature"><span><Icon name="shield" size={18} /></span><div><strong>Policy-led decisions</strong><small>Every outcome is explainable</small></div></div>
      </div>

      {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}

      <div className="section-heading"><div><strong>Featured products</strong><p className="muted-note">Choose an item to create a sample order</p></div><span className="muted-count">{PRODUCTS.length} ITEMS</span></div>

      <div className="product-grid">
        {PRODUCTS.map(p => (
          <div key={p.id} className="product-card group">
            <div className={`product-visual ${p.tint}`}>
              <span className="product-symbol"><Icon name={p.image} size={35} strokeWidth={1.5} /></span>
              <span className="product-category">{p.category}</span>
            </div>
            <div className="product-info">
              <div><h3>{p.name}</h3><p>₹{p.price.toLocaleString('en-IN')}</p></div>
              <button aria-label={`Buy ${p.name}`} disabled={Boolean(buyingId)} onClick={() => handleBuy(p)} className="round-arrow">
                {buyingId === p.id ? <span className="mini-spinner" /> : <Icon name="arrow" size={16} />}
              </button>
            </div>
            <small className="product-footnote"><Icon name="shield" size={12} /> Eligible for policy evaluation</small>
          </div>
        ))}
      </div>
    </div>
  );
}
