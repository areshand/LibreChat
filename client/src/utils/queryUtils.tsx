import React from 'react';
import { OptimizedCodeBlock } from './displayUtils';

// Check if input contains GraphQL query that should be rendered specially
export const getGraphQLQueryData = (text: string) => {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && parsed.query && typeof parsed.query === 'string') {
      return parsed;
    }
  } catch {
    // Not valid JSON, continue with normal rendering
  }
  return null;
};

export function QueryDisplay({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Check for GraphQL query
  const hasGraphQLQuery =
    data.query &&
    typeof data.query === 'string' &&
    (data.query.trim().startsWith('query') ||
      data.query.trim().startsWith('mutation') ||
      data.query.trim().startsWith('subscription') ||
      (data.query.includes('{') && data.query.includes('}')));

  // Check for SQL query
  const hasSQLQuery =
    data.query &&
    typeof data.query === 'string' &&
    /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH)\b/i.test(data.query);

  // Check for other query types
  const hasQuery = data.query && typeof data.query === 'string';

  if (!hasQuery) {
    return null;
  }

  // Format the query for display
  const formattedQuery = data.query
    .replace(/\\n/g, '\n') // Replace escaped newlines with actual newlines
    .replace(/\\"/g, '"') // Replace escaped quotes with actual quotes
    .replace(/\\t/g, '  '); // Replace escaped tabs with spaces

  // Determine query type
  let queryType = 'Query';
  let queryLanguage = '';

  if (hasGraphQLQuery) {
    queryType = 'GraphQL Query';
    queryLanguage = 'graphql';
  } else if (hasSQLQuery) {
    queryType = 'SQL Query';
    queryLanguage = 'sql';
  }

  // Create display object with other properties
  const otherProps = Object.keys(data)
    .filter((key) => key !== 'query')
    .reduce((acc, key) => {
      acc[key] = data[key];
      return acc;
    }, {} as any);

  return (
    <div className="space-y-3">
      {Object.keys(otherProps).length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium text-text-secondary">{'Parameters:'}</div>
          <OptimizedCodeBlock text={JSON.stringify(otherProps, null, 2)} maxHeight={150} />
        </div>
      )}
      <div>
        <div className="mb-2 text-xs font-medium text-text-secondary">{queryType}:</div>
        <div
          className="rounded-lg bg-surface-tertiary p-3 text-xs text-text-primary"
          style={{
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          <pre
            className="m-0 whitespace-pre-wrap break-words font-mono"
            style={{ overflowWrap: 'break-word' }}
          >
            <code className={queryLanguage}>{formattedQuery}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
