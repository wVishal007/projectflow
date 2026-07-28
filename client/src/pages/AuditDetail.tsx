import { useParams, Link } from 'react-router-dom';
import { useAudit, useDeleteAudit } from '../hooks/useAudits';
import { Button } from '../components/ui/Button';

function ScoreGauge({ score }: { score: number }) {
  let color = 'text-red-500';
  let bg = 'from-red-500/20 to-red-500/5';
  let ring = 'stroke-red-500';
  if (score >= 80) { color = 'text-emerald-500'; bg = 'from-emerald-500/20 to-emerald-500/5'; ring = 'stroke-emerald-500'; }
  else if (score >= 60) { color = 'text-amber-500'; bg = 'from-amber-500/20 to-amber-500/5'; ring = 'stroke-amber-500'; }
  else if (score >= 40) { color = 'text-orange-500'; bg = 'from-orange-500/20 to-orange-500/5'; ring = 'stroke-orange-500'; }

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-gray-700" />
        <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className={`${ring} transition-all duration-1000`} />
      </svg>
      <div className="text-center">
        <span className={`text-3xl font-bold ${color}`}>{score}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function GuidanceCard({ title, item }: { title: string; item: any }) {
  if (!item) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">What it is: </span>
          <span className="text-gray-600 dark:text-gray-400">{item.whatItIs}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Why it matters: </span>
          <span className="text-gray-600 dark:text-gray-400">{item.whyItMatters}</span>
        </div>
        <div className="pt-1">
          <span className="font-medium text-primary-600 dark:text-primary-400">Recommendation: </span>
          <span className="text-gray-600 dark:text-gray-400">{item.recommendation}</span>
        </div>
      </div>
    </div>
  );
}

export function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: audit, isLoading, error } = useAudit(id!);
  const deleteAudit = useDeleteAudit();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">Audit not found.</p>
        <Link to="/audits" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
          Back to Audits
        </Link>
      </div>
    );
  }

  const data = audit.data || audit;
  const guidance = data.guidance || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/audits" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            &larr; Back to Audits
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {data.title || data.url}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-lg">{data.url}</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => { deleteAudit.mutate(data.id); }}>
          Delete
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <ScoreGauge score={data.seoScore} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <MetricCard label="Title" value={data.title || 'Missing'} sub={data.title ? `${data.title.length} chars` : undefined} />
          <MetricCard label="Meta Description" value={data.metaDescription ? 'Present' : 'Missing'} sub={data.metaDescription ? `${data.metaDescription.length} chars` : undefined} />
          <MetricCard label="H1 Tags" value={data.h1Count} sub={data.h1List?.join(', ') || 'None'} />
          <MetricCard label="Response Time" value={`${data.responseTime}ms`} />
          <MetricCard label="Word Count" value={data.wordCount} />
          <MetricCard label="Images" value={`${data.totalImages - data.missingAltImages}/${data.totalImages}`} sub="with alt text" />
          <MetricCard label="Canonical URL" value={data.canonicalUrl ? 'Present' : 'Missing'} />
          <MetricCard label="Structured Data" value={data.structuredDataCount} sub="JSON-LD blocks" />
        </div>
      </div>

      {data.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Error: {data.error} ({data.errorCode})
          </p>
        </div>
      )}

      {Object.keys(guidance).length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recommendations</h2>
          <div className="grid gap-4">
            {guidance.title && <GuidanceCard title="Title Tag" item={guidance.title} />}
            {guidance.metaDescription && <GuidanceCard title="Meta Description" item={guidance.metaDescription} />}
            {guidance.h1 && <GuidanceCard title="H1 Heading" item={guidance.h1} />}
            {guidance.accessibility && <GuidanceCard title="Accessibility (Alt Text)" item={guidance.accessibility} />}
            {guidance.content && <GuidanceCard title="Content Depth" item={guidance.content} />}
            {guidance.technical && <GuidanceCard title="Technical SEO" item={guidance.technical} />}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 dark:text-gray-500">
        Audited on {new Date(data.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
