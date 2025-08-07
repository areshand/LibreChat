/* eslint-disable i18next/no-literal-string */
import React from 'react';

// Helper function to render a value in a table cell
const renderValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="italic text-text-secondary">null</span>;
  }
  if (typeof value === 'boolean') {
    return <span className={value ? 'text-green-600' : 'text-red-600'}>{String(value)}</span>;
  }
  if (typeof value === 'number') {
    return <span className="font-mono text-blue-600">{value.toLocaleString()}</span>;
  }
  if (typeof value === 'string') {
    // Truncate very long strings
    if (value.length > 100) {
      return (
        <span className="font-mono text-xs" title={value}>
          {value.substring(0, 100)}...
        </span>
      );
    }
    return <span className="font-mono text-xs">{value}</span>;
  }
  if (typeof value === 'object') {
    return <span className="italic text-text-secondary">Object</span>;
  }
  return String(value);
};

// Helper function to render aggregate data
const renderAggregateData = (obj: any) => {
  const aggregateEntries = Object.entries(obj).filter(
    ([key, value]) => value && typeof value === 'object' && 'aggregate' in value,
  );

  if (aggregateEntries.length > 0) {
    return (
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-semibold text-text-primary">Aggregate Results</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg border border-border-light">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="border-b border-border-light px-3 py-2 text-left text-xs font-medium text-text-primary">
                  Field
                </th>
                <th className="border-b border-border-light px-3 py-2 text-left text-xs font-medium text-text-primary">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {aggregateEntries.map(([key, value]: [string, any]) => (
                <tr key={key} className="hover:bg-surface-secondary/50">
                  <td className="border-b border-border-light px-3 py-2 text-xs text-text-primary">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </td>
                  <td className="border-b border-border-light px-3 py-2 text-xs">
                    {renderValue(value.aggregate?.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  return null;
};

// Helper function to render array data as table
const renderArrayData = (obj: any) => {
  const arrayEntries = Object.entries(obj).filter((entry): entry is [string, any[]] => {
    const [key, value] = entry;
    return Array.isArray(value) && value.length > 0;
  });

  if (arrayEntries.length === 0) return null;

  return arrayEntries.map(([key, value]) => {
    if (!Array.isArray(value) || value.length === 0) return null;

    // Get all unique keys from the array objects
    const allKeys = Array.from(
      new Set(
        value.flatMap((item: any) => (typeof item === 'object' && item ? Object.keys(item) : [])),
      ),
    );

    if (allKeys.length === 0) return null;

    return (
      <div key={key} className="mb-4">
        <h4 className="mb-2 text-sm font-semibold text-text-primary">
          {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} ({value.length} records)
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg border border-border-light">
            <thead className="bg-surface-secondary">
              <tr>
                {allKeys.map((colKey: string) => (
                  <th
                    key={colKey}
                    className="border-b border-border-light px-3 py-2 text-left text-xs font-medium text-text-primary"
                  >
                    {colKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.slice(0, 50).map((item: any, index: number) => (
                <tr key={index} className="hover:bg-surface-secondary/50">
                  {allKeys.map((colKey: string) => (
                    <td key={colKey} className="border-b border-border-light px-3 py-2 text-xs">
                      {renderValue(item[colKey])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {value.length > 50 && (
            <p className="mt-2 text-xs italic text-text-secondary">
              Showing first 50 of {value.length} records
            </p>
          )}
        </div>
      </div>
    );
  });
};

// Check if output contains tabular data that should be rendered as table
export const getTabularData = (text: string | null) => {
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);

    // Check if this looks like a GraphQL response with data
    if (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object') {
      return parsed.data;
    }

    // Check if this is an array of objects with type "text" containing tabular data
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type === 'text') {
      try {
        const innerData = JSON.parse(parsed[0].text);
        if (innerData && typeof innerData === 'object') {
          // Check for GraphQL data structure
          if (innerData.data && typeof innerData.data === 'object') {
            return innerData.data;
          }
          // Check for direct tabular data (arrays of objects)
          const hasTabularData = Object.values(innerData).some(
            (value) =>
              Array.isArray(value) &&
              value.length > 0 &&
              typeof value[0] === 'object' &&
              value[0] !== null,
          );
          if (hasTabularData) {
            return innerData;
          }
        }
      } catch {
        // Not parseable inner JSON, continue with normal rendering
      }
    }

    // Check for direct tabular data structures
    if (parsed && typeof parsed === 'object') {
      // Check if it has arrays of objects (common table format)
      const hasTabularData = Object.values(parsed).some(
        (value) =>
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === 'object' &&
          value[0] !== null,
      );

      // Check if it has aggregate data (common in database results)
      const hasAggregateData = Object.values(parsed).some(
        (value) => value && typeof value === 'object' && 'aggregate' in value,
      );

      if (hasTabularData || hasAggregateData) {
        return parsed;
      }
    }

    // Check if it's a direct array of objects (simple table format)
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === 'object' &&
      parsed[0] !== null
    ) {
      return { data: parsed }; // Wrap in object for consistent handling
    }
  } catch {
    // Not valid JSON, continue with normal rendering
  }

  return null;
};

export function DataTable({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return (
    <div className="space-y-4">
      {renderAggregateData(data)}
      {renderArrayData(data)}
    </div>
  );
}
