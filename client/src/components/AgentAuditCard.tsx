import Icon from './Icon';

type Audit = {
  created_at?: string;
  events?: Array<{ event?: string; at?: string; decision?: string; reviewer_user_id?: number }>;
  roles?: Record<string, any>;
  disagreements?: Array<{ between?: string[]; detail?: string }>;
  escalations?: string[];
  final_decision?: string;
  execution?: { performed?: boolean; payment_or_shipment_tools_available?: boolean };
};

const ROLE_LABELS: Record<string, string> = {
  policy: 'Policy evaluator',
  risk: 'Risk evaluator',
  jev: 'Jev claim analyst',
  proposal: 'Resolution proposer',
};

export default function AgentAuditCard({ audit = {} }: { audit?: Audit }) {
  if (!audit.roles) return <section className="detail-panel"><div className="panel-title"><span className="panel-title-icon violet"><Icon name="shield" /></span><div><strong>Decision audit</strong><small>No role audit was saved for this older case.</small></div></div></section>;

  const policy = audit.roles.policy?.output || {};
  const risk = audit.roles.risk?.output || {};
  const jev = audit.roles.jev || {};
  const jevOutput = jev.output || {};
  const proposal = audit.roles.proposal?.output || {};

  return <section className="detail-panel agent-audit-panel">
    <div className="panel-title"><span className="panel-title-icon violet"><Icon name="spark" /></span><div><strong>Decision audit</strong><small>Role outputs, escalation signals, and Jev run metadata</small></div><span className={`status-pill ${proposal.requires_human_review ? 'status-warning' : 'status-info'}`}>{proposal.requires_human_review ? 'Human review' : 'Clear'}</span></div>
    <div className="audit-role-grid">
      {Object.entries(audit.roles).map(([key, value]: [string, any]) => <article className="audit-role" key={key}>
        <strong>{ROLE_LABELS[key] || key}</strong>
        <p>{value.assessed}</p>
        <small>{key === 'policy' ? `Policy result: ${policy.decision || '—'}` : key === 'risk' ? `Risk score: ${typeof risk.score === 'number' ? risk.score.toFixed(2) : '—'}` : key === 'jev' ? `Jev status: ${jevOutput.status || '—'} · ${jevOutput.model || 'model unknown'}` : `Proposal: ${proposal.recommendation || '—'}`}</small>
        {key === 'jev' && jev.run_id && <small>Run ID: {jev.run_id}</small>}
      </article>)}
    </div>
    {!!audit.escalations?.length && <div className="audit-signals"><span className="subtle-label">REVIEW TRIGGERS</span>{audit.escalations.map(reason => <p key={reason}><Icon name="clock" size={12} />{reason.replaceAll('_', ' ')}</p>)}</div>}
    {!!audit.disagreements?.length && <div className="audit-signals"><span className="subtle-label">ROLE DISAGREEMENTS</span>{audit.disagreements.map((item, index) => <p key={index}><Icon name="alert" size={12} />{item.detail}</p>)}</div>}
    {!!audit.events?.length && <div className="audit-signals"><span className="subtle-label">CASE EVENTS</span>{audit.events.map((event, index) => <p key={`${event.event}-${index}`}><Icon name="clock" size={12} />{(event.event || 'case event').replaceAll('_', ' ')}{event.decision ? ` · ${event.decision.replaceAll('_', ' ')}` : ''}{event.at ? ` · ${new Date(event.at).toLocaleString()}` : ''}</p>)}</div>}
    <div className="audit-safety-note"><Icon name="shield" size={13} /> No payment or shipment action was executed by this workflow.</div>
  </section>;
}
