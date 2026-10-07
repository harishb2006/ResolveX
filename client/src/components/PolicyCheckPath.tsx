import type { CSSProperties } from 'react';
import Icon from './Icon';

export type PolicyCheck = { key: string; label: string; passed: boolean; detail: string };

export default function PolicyCheckPath({ checks }: { checks: PolicyCheck[] }) {
  const passed = checks.filter(check => check.passed).length;
  const progress = checks.length ? `${(passed / checks.length) * 100}%` : '0%';
  return <div className="policy-path" style={{ '--path-progress': progress } as CSSProperties}>
    <div className="path-track"><div className="path-fill" /></div>
    {checks.map(check => <div className={`policy-node-row ${check.passed ? 'passed' : 'failed'}`} key={check.key}>
      <span className="policy-node">{check.passed ? <Icon name="check" size={13} /> : <span>!</span>}</span>
      <div className="policy-node-copy"><strong>{check.label}</strong><small>{check.detail}</small></div>
      <span className={`node-status ${check.passed ? 'passed' : 'failed'}`}>{check.passed ? 'Passed' : 'Review'}</span>
    </div>)}
  </div>;
}
