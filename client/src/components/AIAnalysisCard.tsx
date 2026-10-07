import Icon from './Icon';

type Analysis = {
  status?: string;
  provider?: string;
  model?: string;
  summary?: string | null;
  reason_classification?: string | null;
  reason_alignment?: string | null;
  severity?: string | null;
  possible_warranty_issue?: boolean | null;
  evidence_findings?: string[];
  evidence_consistency?: string | null;
  confidence?: number | null;
  limitations?: string[];
  usage?: { input_tokens?: number; output_tokens?: number } | null;
};

export default function AIAnalysisCard({ analysis = {} }: { analysis?: Analysis }) {
  const analyzed = analysis.status === 'analyzed';
  const statusLabel = analyzed ? 'Analysis ready' : analysis.status === 'not_configured' ? 'Provider not configured' : analysis.status === 'invalid_evidence' ? 'Image not analyzed' : 'AI analysis unavailable';

  return <section className="ai-analysis-card">
    <div className="ai-analysis-header"><span className="ai-analysis-icon"><Icon name="spark" size={15} /></span><div className="ai-analysis-heading"><strong>AI claim analysis</strong><small>Jev AI · supporting context only</small></div><span className={`ai-status ${analyzed ? 'ready' : 'idle'}`}><i />{statusLabel}</span></div>
    {analyzed ? <>
      <p className="ai-summary">{analysis.summary}</p>
      <div className="ai-tags">
        <span><small>ISSUE</small><strong>{(analysis.reason_classification || 'unclear').replaceAll('_', ' ')}</strong></span>
        {analysis.reason_alignment && <span><small>REASON MATCH</small><strong>{analysis.reason_alignment.replaceAll('_', ' ')}</strong></span>}
        <span><small>SEVERITY</small><strong>{analysis.severity || 'unclear'}</strong></span>
        <span><small>IMAGE PIXELS</small><strong>not analyzed</strong></span>
        {analysis.possible_warranty_issue !== null && analysis.possible_warranty_issue !== undefined && <span><small>WARRANTY SIGNAL</small><strong>{analysis.possible_warranty_issue ? 'Possible' : 'Not indicated'}</strong></span>}
      </div>
      {!!analysis.evidence_findings?.length && <div className="ai-findings"><span className="subtle-label">OBSERVED IN EVIDENCE</span>{analysis.evidence_findings.map((finding, index) => <p key={index}><Icon name="check" size={12} />{finding}</p>)}</div>}
      <div className="ai-confidence-row"><span>AI analysis confidence</span><strong>{Math.round((analysis.confidence || 0) * 100)}%</strong></div>
      <div className="ai-confidence-meter"><i style={{ width: `${Math.max(0, Math.min(1, analysis.confidence || 0)) * 100}%` }} /></div>
    </> : <p className="ai-not-ready">{analysis.limitations?.[0] || 'Configure Jev AI to classify the return description. Policy and risk checks continue without it.'}</p>}
    <div className="ai-analysis-footer"><span>{analysis.provider || 'Jev AI'}{analysis.model ? ` · ${analysis.model}` : ''}{analysis.usage?.input_tokens !== undefined ? ` · ${analysis.usage.input_tokens} input tokens` : ''}</span><span>AI output is fallible and is not used to approve, reject, or issue a refund.</span></div>
  </section>;
}
