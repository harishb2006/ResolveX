import Icon from './Icon';

export type RiskFactor = {
  key: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  detail: string;
};

export default function RiskBreakdown({ score, level, threshold = 0.6, factors = [] }: {
  score: number;
  level: string;
  threshold?: number;
  factors?: RiskFactor[];
}) {
  return <section className="risk-breakdown-panel">
    <div className="risk-breakdown-head">
      <span className="risk-heading-icon"><Icon name="shield" size={15} /></span>
      <div className="risk-heading-copy"><strong>Risk score breakdown</strong><small>Weighted signals used to route this case</small></div>
      <span className="risk-summary"><strong>{Math.round(score * 100)}%</strong><span className={`risk-level ${level.toLowerCase()}`}>{level} RISK</span></span>
    </div>
    <div className="risk-factor-list">
      {factors.length ? factors.map(factor => <div className="risk-factor" key={factor.key}>
        <div className="risk-factor-top"><strong>{factor.label}</strong><span>{Math.round(factor.weight * 100)}% weight</span></div>
        <div className="risk-factor-meter"><i style={{ width: `${Math.max(0, Math.min(1, factor.score)) * 100}%` }} /></div>
        <div className="risk-factor-bottom"><small>{factor.detail}</small><span>+{Math.round(factor.contribution * 100)} pts</span></div>
      </div>) : <p className="risk-empty">No stored signal breakdown is available for this older request.</p>}
    </div>
    <div className="risk-threshold-note"><Icon name="spark" size={12} /><span>Scores at or above {Math.round(threshold * 100)}% send otherwise approvable cases to human review.</span></div>
  </section>;
}
