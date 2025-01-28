import { SeoIssue, TitleAnalysis, DescriptionAnalysis, PerformanceAnalysis } from '@/types/analysis'

const TITLE_LENGTH = {
  MIN: 30,
  MAX: 60,
} as const

const DESCRIPTION_LENGTH = {
  MIN: 120,
  MAX: 155,
} as const

export function analyzeTitleTag(title: string): TitleAnalysis {
  const issues: SeoIssue[] = [];
  const minLength = TITLE_LENGTH.MIN;
  const maxLength = TITLE_LENGTH.MAX;
  
  if (!title) {
    issues.push({
      type: 'error',
      message: 'Missing title tag',
      details: 'Every page should have a title tag'
    });
  } else {
    if (title.length < minLength) {
      issues.push({
        type: 'warning',
        message: 'Title tag too short',
        details: `Title should be at least ${minLength} characters. Current length: ${title.length}`
      });
    }
    if (title.length > maxLength) {
      issues.push({
        type: 'warning',
        message: 'Title tag too long',
        details: `Title should be no more than ${maxLength} characters. Current length: ${title.length}`
      });
    }
  }

  return {
    text: title,
    length: title.length,
    isOptimal: issues.length === 0,
    issues
  };
}

export function analyzeMetaDescription(description: string): DescriptionAnalysis {
  const issues: SeoIssue[] = [];
  const minLength = DESCRIPTION_LENGTH.MIN;
  const maxLength = DESCRIPTION_LENGTH.MAX;
  
  if (!description) {
    issues.push({
      type: 'error',
      message: 'Missing meta description',
      details: 'Every page should have a meta description'
    });
  } else {
    if (description.length < minLength) {
      issues.push({
        type: 'warning',
        message: 'Meta description too short',
        details: `Description should be at least ${minLength} characters. Current length: ${description.length}`
      });
    }
    if (description.length > maxLength) {
      issues.push({
        type: 'warning',
        message: 'Meta description too long',
        details: `Description should be no more than ${maxLength} characters. Current length: ${description.length}`
      });
    }
  }

  return {
    text: description,
    length: description.length,
    isOptimal: issues.length === 0,
    issues
  };
}

export function analyzeLoadTime(loadTime: number): PerformanceAnalysis {
  const issues: SeoIssue[] = [];
  const slowThreshold = 3000; // 3 seconds
  const verySlowThreshold = 5000; // 5 seconds
  
  if (loadTime > verySlowThreshold) {
    issues.push({
      type: 'error',
      message: 'Very slow load time',
      details: `Page took ${Math.round(loadTime)}ms to load. Should be under ${verySlowThreshold}ms`
    });
  } else if (loadTime > slowThreshold) {
    issues.push({
      type: 'warning',
      message: 'Slow load time',
      details: `Page took ${Math.round(loadTime)}ms to load. Should be under ${slowThreshold}ms`
    });
  }

  return {
    loadTime,
    issues
  };
}

export function calculateSeoScore(analyses: { issues: SeoIssue[] }[]): number {
  const totalIssues = analyses.reduce((sum, analysis) => sum + analysis.issues.length, 0);
  const errorCount = analyses.reduce((sum, analysis) => 
    sum + analysis.issues.filter(i => i.type === 'error').length, 0
  );
  const warningCount = analyses.reduce((sum, analysis) => 
    sum + analysis.issues.filter(i => i.type === 'warning').length, 0
  );
  
  // Each error reduces score by 20%, each warning by 5%
  const score = 100 - (errorCount * 20) - (warningCount * 5);
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}
