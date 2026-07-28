import * as cheerio from 'cheerio';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../errors/NotFoundError';
import { AppError } from '../../errors/AppError';
import { AuditResult, AuditGuidance, GuidanceItem } from './audits.types';
import { CreateAuditInput } from './audits.schema';
import { auditCache } from './audits.cache';
import { getPaginationParams, buildPaginatedMeta } from '../../utils/pagination';
import { Request } from 'express';
import { CONSTANTS } from '../../config/constants';
import { createChildLogger } from '../../utils/logger';

const logger = createChildLogger('audits-service');

const FETCH_TIMEOUT_MS = parseInt(process.env.AUDIT_FETCH_TIMEOUT_MS || '10000', 10);

export class AuditsService {
  async create(input: CreateAuditInput, userId: string): Promise<AuditResult> {
    const cached = auditCache.get(input.url);
    if (cached) {
      logger.info({ url: input.url }, 'Cache hit');
      const stored = await this.storeInDb(input.url, cached, userId);
      return cached;
    }

    const result = await this.fetchAndAnalyze(input.url);
    auditCache.set(input.url, result);
    await this.storeInDb(input.url, result, userId);
    return result;
  }

  async list(userId: string, req: Request) {
    const { page, limit, skip } = getPaginationParams(req);
    const { sortBy, sortOrder } = req.query as { sortBy?: string; sortOrder?: string };

    const orderBy: Record<string, string> = {};
    const sortField = sortBy || 'created_at';
    orderBy[sortField] = sortOrder || 'desc';

    const where = { userId };

    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          url: true,
          title: true,
          seoScore: true,
          responseTime: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.audit.count({ where }),
    ]);

    return { audits, meta: buildPaginatedMeta(total, page, limit) };
  }

  async getById(auditId: string, userId: string) {
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) throw new NotFoundError('Audit');
    if (audit.userId !== userId) throw new AppError('Access denied', 403, 'FORBIDDEN');
    return audit;
  }

  async delete(auditId: string, userId: string) {
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) throw new NotFoundError('Audit');
    if (audit.userId !== userId) throw new AppError('Access denied', 403, 'FORBIDDEN');
    await prisma.audit.delete({ where: { id: auditId } });
    return { id: auditId };
  }

  private async fetchAndAnalyze(url: string): Promise<AuditResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ProjectFlow-Audit/1.0',
          'Accept': 'text/html,application/xhtml+xml,*/*',
        },
        redirect: 'follow',
      });

      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      const contentType = response.headers.get('content-type') || '';
      const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml');

      if (!response.ok) {
        return this.buildErrorResult(url, responseTime, `HTTP ${response.status}`, 'HTTP_ERROR');
      }

      if (!isHtml) {
        return this.buildErrorResult(url, responseTime, `Non-HTML content type: ${contentType}`, 'NON_HTML_RESPONSE');
      }

      const html = await response.text();
      return this.parseHtml(url, html, responseTime, contentType);
    } catch (err: any) {
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;

      if (err.name === 'AbortError') {
        return this.buildErrorResult(url, responseTime, 'Request timed out', 'TIMEOUT_ERROR');
      }
      if (err.code === 'ENOTFOUND') {
        return this.buildErrorResult(url, responseTime, 'DNS resolution failed', 'DNS_FAILURE');
      }
      if (err.code === 'ECONNREFUSED') {
        return this.buildErrorResult(url, responseTime, 'Connection refused', 'CONNECTION_REFUSED');
      }
      if (err.cause?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        return this.buildErrorResult(url, responseTime, 'SSL certificate error', 'SSL_ERROR');
      }

      return this.buildErrorResult(url, responseTime, err.message || 'Unknown fetch error', 'FETCH_ERROR');
    }
  }

  private parseHtml(url: string, html: string, responseTime: number, contentType: string): AuditResult {
    const $ = cheerio.load(html);

    $('script, style, svg, noscript').remove();

    const title = $('title').first().text().trim() || null;
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;

    const h1Elements: string[] = [];
    $('h1').each(function (_: number, el: any) {
      const text = $(el).text().trim();
      if (text) h1Elements.push(text);
    });

    let totalImages = 0;
    let missingAltImages = 0;
    $('img').each(function (_: number, el: any) {
      totalImages++;
      const alt = $(el).attr('alt');
      if (!alt || alt.trim() === '') missingAltImages++;
    });

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText ? bodyText.split(/\s+/).filter((w) => w.length > 0).length : 0;

    const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
    const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]')?.attr('content')?.match(/charset=([^\s;]+)/)?.[1] || null;

    let structuredDataCount = 0;
    $('script[type="application/ld+json"]').each(function () { structuredDataCount++; });

    const seoScore = this.calculateScore({
      title,
      metaDescription,
      h1Count: h1Elements.length,
      missingAltImages,
      totalImages,
      wordCount,
      canonicalUrl,
      charset,
      structuredDataCount,
    });

    const guidance = this.buildGuidance({
      title,
      metaDescription,
      h1Count: h1Elements.length,
      missingAltImages,
      totalImages,
      wordCount,
      canonicalUrl,
      charset,
      structuredDataCount,
      seoScore,
    });

    return {
      url,
      title,
      metaDescription,
      h1Count: h1Elements.length,
      h1List: h1Elements,
      missingAltImages,
      totalImages,
      wordCount,
      seoScore,
      responseTime,
      contentType,
      canonicalUrl,
      charset,
      isHtml: true,
      structuredDataCount,
      guidance,
      status: 'success',
    };
  }

  private calculateScore(metrics: {
    title: string | null;
    metaDescription: string | null;
    h1Count: number;
    missingAltImages: number;
    totalImages: number;
    wordCount: number;
    canonicalUrl: string | null;
    charset: string | null;
    structuredDataCount: number;
  }): number {
    let score = 0;

    if (metrics.title) {
      score += 10;
      if (metrics.title.length >= 10 && metrics.title.length <= 60) score += 10;
    }

    if (metrics.metaDescription) {
      score += 10;
      if (metrics.metaDescription.length >= 50 && metrics.metaDescription.length <= 160) score += 10;
    }

    if (metrics.h1Count === 1) score += 15;
    else if (metrics.h1Count > 1) score += 5;

    if (metrics.totalImages > 0) {
      const altRatio = 1 - metrics.missingAltImages / metrics.totalImages;
      score += Math.round(altRatio * 15);
    } else {
      score += 15;
    }

    if (metrics.wordCount > 300) score += 10;
    else if (metrics.wordCount > 100) score += 5;

    if (metrics.canonicalUrl) score += 10;
    if (metrics.charset) score += 5;
    if (metrics.structuredDataCount > 0) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private buildGuidance(metrics: {
    title: string | null;
    metaDescription: string | null;
    h1Count: number;
    missingAltImages: number;
    totalImages: number;
    wordCount: number;
    canonicalUrl: string | null;
    charset: string | null;
    structuredDataCount: number;
    seoScore: number;
  }): AuditGuidance {
    const guidance: AuditGuidance = {};

    if (metrics.title) {
      const len = metrics.title.length;
      if (len < 10) {
        guidance.title = {
          whatItIs: 'The primary HTML page title tag rendered in browser tabs and SERPs.',
          whyItMatters: 'Directly impacts SERP click-through rate (CTR) and search indexing.',
          recommendation: 'Title is too short. Aim for 10-60 characters that clearly describe the page.',
        };
      } else if (len > 60) {
        guidance.title = {
          whatItIs: 'The primary HTML page title tag rendered in browser tabs and SERPs.',
          whyItMatters: 'Directly impacts SERP click-through rate (CTR) and search indexing.',
          recommendation: 'Title is too long and may be truncated in SERPs. Keep it under 60 characters.',
        };
      } else {
        guidance.title = {
          whatItIs: 'The primary HTML page title tag rendered in browser tabs and SERPs.',
          whyItMatters: 'Directly impacts SERP click-through rate (CTR) and search indexing.',
          recommendation: 'Title length is optimal (10-60 characters).',
        };
      }
    } else {
      guidance.title = {
        whatItIs: 'The primary HTML page title tag rendered in browser tabs and SERPs.',
        whyItMatters: 'Directly impacts SERP click-through rate (CTR) and search indexing.',
        recommendation: 'Missing title tag. Add a descriptive <title> between 10-60 characters.',
      };
    }

    if (metrics.metaDescription) {
      const len = metrics.metaDescription.length;
      if (len < 50) {
        guidance.metaDescription = {
          whatItIs: 'The HTML meta description tag shown below the title in search results.',
          whyItMatters: 'Influences whether users click through from search results.',
          recommendation: 'Meta description is too short. Write 50-160 characters summarizing the page.',
        };
      } else if (len > 160) {
        guidance.metaDescription = {
          whatItIs: 'The HTML meta description tag shown below the title in search results.',
          whyItMatters: 'Influences whether users click through from search results.',
          recommendation: 'Meta description is too long and may be truncated. Keep it under 160 characters.',
        };
      } else {
        guidance.metaDescription = {
          whatItIs: 'The HTML meta description tag shown below the title in search results.',
          whyItMatters: 'Influences whether users click through from search results.',
          recommendation: 'Meta description length is optimal (50-160 characters).',
        };
      }
    } else {
      guidance.metaDescription = {
        whatItIs: 'The HTML meta description tag shown below the title in search results.',
        whyItMatters: 'Influences whether users click through from search results.',
        recommendation: 'Missing meta description. Add a <meta name="description"> tag with 50-160 characters.',
      };
    }

    if (metrics.h1Count === 0) {
      guidance.h1 = {
        whatItIs: 'The main heading tag (<h1>) representing the primary topic of the page.',
        whyItMatters: 'Helps search engines understand page structure and main content topic.',
        recommendation: 'No H1 tag found. Add exactly one <h1> tag per page.',
      };
    } else if (metrics.h1Count === 1) {
      guidance.h1 = {
        whatItIs: 'The main heading tag (<h1>) representing the primary topic of the page.',
        whyItMatters: 'Helps search engines understand page structure and main content topic.',
        recommendation: 'Page has exactly one H1 tag — optimal for SEO.',
      };
    } else {
      guidance.h1 = {
        whatItIs: 'The main heading tag (<h1>) representing the primary topic of the page.',
        whyItMatters: 'Helps search engines understand page structure and main content topic.',
        recommendation: `Found ${metrics.h1Count} H1 tags. Use exactly one H1 per page for best SEO.`,
      };
    }

    if (metrics.missingAltImages > 0) {
      guidance.accessibility = {
        whatItIs: 'Alternative text descriptions (alt attributes) on <img> elements.',
        whyItMatters: 'Essential for visually impaired users relying on screen readers.',
        recommendation: `Add non-empty alt="description" attributes to the ${metrics.missingAltImages} flagged images.`,
      };
    } else {
      guidance.accessibility = {
        whatItIs: 'Alternative text descriptions (alt attributes) on <img> elements.',
        whyItMatters: 'Essential for visually impaired users relying on screen readers.',
        recommendation: 'All images have alt text — excellent accessibility.',
      };
    }

    if (metrics.wordCount < 300) {
      guidance.content = {
        whatItIs: 'The visible text content of the page (excluding scripts, styles, and SVG).',
        whyItMatters: 'Search engines use content depth to assess page relevance and authority.',
        recommendation: `Only ${metrics.wordCount} words found. Aim for 300+ words of unique, valuable content.`,
      };
    } else {
      guidance.content = {
        whatItIs: 'The visible text content of the page (excluding scripts, styles, and SVG).',
        whyItMatters: 'Search engines use content depth to assess page relevance and authority.',
        recommendation: `Good content depth with ${metrics.wordCount} words.`,
      };
    }

    const techIssues: string[] = [];
    if (!metrics.canonicalUrl) techIssues.push('Add a <link rel="canonical"> tag');
    if (!metrics.charset) techIssues.push('Add a <meta charset> declaration');
    if (metrics.structuredDataCount === 0) techIssues.push('Consider adding JSON-LD structured data');

    guidance.technical = {
      whatItIs: 'Technical SEO elements that help search engines crawl and index the page.',
      whyItMatters: 'Proper technical setup prevents indexing issues and improves crawl efficiency.',
      recommendation: techIssues.length > 0 ? techIssues.join('. ') + '.' : 'All technical SEO basics are in place.',
    };

    return guidance;
  }

  private buildErrorResult(url: string, responseTime: number, error: string, errorCode: string): AuditResult {
    return {
      url,
      title: null,
      metaDescription: null,
      h1Count: 0,
      h1List: [],
      missingAltImages: 0,
      totalImages: 0,
      wordCount: 0,
      seoScore: 0,
      responseTime,
      contentType: null,
      canonicalUrl: null,
      charset: null,
      isHtml: false,
      structuredDataCount: 0,
      guidance: {},
      status: 'error',
      error,
      errorCode,
    };
  }

  private async storeInDb(url: string, result: AuditResult, userId: string) {
    try {
      return await prisma.audit.create({
        data: {
          url,
          title: result.title,
          metaDescription: result.metaDescription,
          h1Count: result.h1Count,
          h1List: result.h1List,
          missingAltImages: result.missingAltImages,
          totalImages: result.totalImages,
          wordCount: result.wordCount,
          seoScore: result.seoScore,
          responseTime: result.responseTime,
          contentType: result.contentType,
          canonicalUrl: result.canonicalUrl,
          charset: result.charset,
          isHtml: result.isHtml,
          structuredDataCount: result.structuredDataCount,
          guidance: result.guidance as any,
          error: result.error,
          errorCode: result.errorCode,
          status: result.status,
          userId,
        },
      });
    } catch (err) {
      logger.error({ err, url }, 'Failed to store audit in database');
      return null;
    }
  }
}

export const auditsService = new AuditsService();
