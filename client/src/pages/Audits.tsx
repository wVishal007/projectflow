import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAudits, useCreateAudit } from '../hooks/useAudits';
import { Button } from '../components/ui/Button';

function ScoreBadge({ score }: { score: number }) {
  let color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (score >= 80) color = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  else if (score >= 60) color = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  else if (score >= 40) color = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${color}`}>
      {score}
    </span>
  );
}

export function Audits() {
  const [url, setUrl] = useState('');
  const { data: auditsData, isLoading } = useAudits();
  const createAudit = useCreateAudit();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim()) return;
      createAudit.mutate({ url: url.trim() });
      setUrl('');
    },
    [url, createAudit]
  );

  const audits = auditsData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Website Audits</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Analyze any website for SEO, accessibility, and performance.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL (e.g., https://example.com)"
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        <Button type="submit" loading={createAudit.isPending} disabled={!url.trim()}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Audit
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : audits.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No audits yet. Enter a URL above to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">URL</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Response</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {audits.map((audit: any) => (
                <tr key={audit.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/audits/${audit.id}`} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline truncate block max-w-xs">
                      {audit.title || audit.url}
                    </Link>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">{audit.url}</p>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={audit.seoScore} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{audit.responseTime}ms</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(audit.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
