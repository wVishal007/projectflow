export interface AuditResult {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  h1List: string[];
  missingAltImages: number;
  totalImages: number;
  wordCount: number;
  seoScore: number;
  responseTime: number;
  contentType: string | null;
  canonicalUrl: string | null;
  charset: string | null;
  isHtml: boolean;
  structuredDataCount: number;
  guidance: AuditGuidance;
  status: 'success' | 'error';
  error?: string;
  errorCode?: string;
}

export interface AuditGuidance {
  title?: GuidanceItem;
  metaDescription?: GuidanceItem;
  h1?: GuidanceItem;
  accessibility?: GuidanceItem;
  content?: GuidanceItem;
  technical?: GuidanceItem;
}

export interface GuidanceItem {
  whatItIs: string;
  whyItMatters: string;
  recommendation: string;
}
