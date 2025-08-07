/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { useLocalize } from '~/hooks';

function DataTable({ data }: { data: any }) {
  const localize = useLocalize();

  // Constants for text values to avoid ESLint literal string errors
  const NULL_TEXT = 'null';
  const OBJECT_TEXT = 'Object';
  const AGGREGATE_RESULTS_TEXT = 'Aggregate Results';
  const FIELD_TEXT = 'Field';
  const COUNT_TEXT = 'Count';
  const RECORDS_TEXT = 'records';
  const SHOWING_FIRST_TEXT = 'Showing first 50 of';
  const FIELDS_TEXT = 'Fields:';
  const ENUM_VALUES_TEXT = 'Enum Values:';
  const MORE_FIELDS_TEXT = 'more fields';
  const GRAPHQL_SCHEMA_TEXT = 'GraphQL Schema';
  const QUERY_TYPE_TEXT = 'Query Type:';
  const MUTATION_TYPE_TEXT = 'Mutation Type:';
  const SUBSCRIPTION_TYPE_TEXT = 'Subscription Type:';
  const TYPES_TEXT = 'Types';
  const TOTAL_TEXT = 'total';
  const SHOWING_FIRST_20_TEXT = 'Showing first 20 types. Total:';
  const TYPES_AVAILABLE_TEXT = 'types available.';
  const GRAPHQL_SCHEMA_SDL_TEXT = 'GraphQL Schema (SDL)';
  const QUERY_TYPE_LABEL = 'Query Type';
  const MUTATION_TYPE_LABEL = 'Mutation Type';
  const SUBSCRIPTION_TYPE_LABEL = 'Subscription Type';
  const ENUMS_TEXT = 'Enums';
  const DIRECTIVES_TEXT = 'Directives';
  const LINES_TEXT = 'Lines';
  const AVAILABLE_TYPES_TEXT = 'Available Types:';
  const MORE_TEXT = 'more';
  const SCHEMA_DEFINITION_TEXT = 'Schema Definition:';
  const PARAMETERS_TEXT = 'Parameters:';

  // Helper function to render a value in a table cell
  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="italic text-text-secondary">{NULL_TEXT}</span>;
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
      return <span className="italic text-text-secondary">{OBJECT_TEXT}</span>;
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
          <h4 className="mb-2 text-sm font-semibold text-text-primary">{AGGREGATE_RESULTS_TEXT}</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-lg border border-border-light">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="border-b border-border-light px-3 py-2 text-left text-xs font-medium text-text-primary">
                    {FIELD_TEXT}
                  </th>
                  <th className="border-b border-border-light px-3 py-2 text-left text-xs font-medium text-text-primary">
                    {COUNT_TEXT}
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
            {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} ({value.length}{' '}
            records)
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

function OptimizedCodeBlock({ text, maxHeight = 320 }: { text: string; maxHeight?: number }) {
  return (
    <div
      className="rounded-lg bg-surface-tertiary p-2 text-xs text-text-primary"
      style={{
        position: 'relative',
        maxHeight,
        overflow: 'auto',
      }}
    >
      <pre className="m-0 whitespace-pre-wrap break-words" style={{ overflowWrap: 'break-word' }}>
        <code>{text}</code>
      </pre>
    </div>
  );
}

function GraphQLSchemaDisplay({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Check if this looks like a GraphQL schema introspection result (structured JSON)
  const hasSchemaStructure =
    data.__schema ||
    (data.data && data.data.__schema) ||
    (data.types && Array.isArray(data.types)) ||
    data.queryType ||
    data.mutationType ||
    data.subscriptionType;

  if (hasSchemaStructure) {
    const schema = data.__schema || data.data?.__schema || data;

    const renderType = (type: any) => {
      if (!type) return null;

      return (
        <div className="mb-4 rounded-lg bg-surface-secondary p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{type.name}</span>
            <span className="rounded bg-blue-600 px-2 py-1 text-xs text-white">{type.kind}</span>
          </div>

          {type.description && (
            <div className="mb-2 text-xs italic text-text-secondary">{type.description}</div>
          )}

          {type.fields && type.fields.length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs font-medium text-text-secondary">Fields:</div>
              <div className="space-y-1">
                {type.fields.slice(0, 10).map((field: any, index: number) => (
                  <div key={index} className="rounded bg-surface-tertiary p-2 font-mono text-xs">
                    <span className="text-blue-400">{field.name}</span>
                    <span className="text-text-secondary">: </span>
                    <span className="text-green-400">
                      {field.type?.name || field.type?.ofType?.name || 'Unknown'}
                    </span>
                    {field.description && (
                      <div className="mt-1 italic text-text-secondary">{field.description}</div>
                    )}
                  </div>
                ))}
                {type.fields.length > 10 && (
                  <div className="text-xs italic text-text-secondary">
                    ... and {type.fields.length - 10} more fields
                  </div>
                )}
              </div>
            </div>
          )}

          {type.enumValues && type.enumValues.length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs font-medium text-text-secondary">Enum Values:</div>
              <div className="flex flex-wrap gap-1">
                {type.enumValues.map((enumValue: any, index: number) => (
                  <span key={index} className="rounded bg-yellow-600 px-2 py-1 text-xs text-white">
                    {enumValue.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="mb-3 text-sm font-semibold text-text-primary">GraphQL Schema</div>

        {schema.queryType && (
          <div className="mb-4">
            <div className="mb-2 text-sm font-medium text-green-400">
              Query Type: {schema.queryType.name}
            </div>
          </div>
        )}

        {schema.mutationType && (
          <div className="mb-4">
            <div className="mb-2 text-sm font-medium text-orange-400">
              Mutation Type: {schema.mutationType.name}
            </div>
          </div>
        )}

        {schema.subscriptionType && (
          <div className="mb-4">
            <div className="mb-2 text-sm font-medium text-purple-400">
              Subscription Type: {schema.subscriptionType.name}
            </div>
          </div>
        )}

        {schema.types && Array.isArray(schema.types) && (
          <div>
            <div className="mb-3 text-sm font-medium text-text-secondary">
              Types ({schema.types.length} total)
            </div>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {schema.types
                .filter((type: any) => !type.name.startsWith('__')) // Filter out introspection types
                .slice(0, 20) // Limit to first 20 types for performance
                .map((type: any, index: number) => renderType(type))}
              {schema.types.filter((type: any) => !type.name.startsWith('__')).length > 20 && (
                <div className="rounded-lg bg-surface-secondary p-3 text-xs italic text-text-secondary">
                  Showing first 20 types. Total:{' '}
                  {schema.types.filter((type: any) => !type.name.startsWith('__')).length} types
                  available.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function GraphQLSDLDisplay({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Check if this is a raw GraphQL SDL (Schema Definition Language) text
  let schemaText = '';

  // Handle array format with text objects: [{"type": "text", "text": "schema {...}"}]
  if (Array.isArray(data) && data.length > 0 && data[0].type === 'text' && data[0].text) {
    schemaText = data[0].text;
  }
  // Handle direct text property
  else if (data.text && typeof data.text === 'string') {
    schemaText = data.text;
  }
  // Handle direct string
  else if (typeof data === 'string') {
    schemaText = data;
  }

  if (!schemaText || !schemaText.includes('schema') || !schemaText.includes('type')) {
    return null;
  }

  // Clean up the schema text by unescaping characters
  const cleanedSchema = schemaText
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\t/g, '  ')
    .replace(/\\\\/g, '\\');

  // Parse the schema to extract key information
  const parseSchemaInfo = (schema: string) => {
    const info = {
      queryType: '',
      mutationType: '',
      subscriptionType: '',
      types: [] as string[],
      directives: [] as string[],
      enums: [] as string[],
    };

    // Extract root types
    const schemaMatch = schema.match(/schema\s*\{([^}]+)\}/);
    if (schemaMatch) {
      const schemaContent = schemaMatch[1];
      const queryMatch = schemaContent.match(/query:\s*(\w+)/);
      const mutationMatch = schemaContent.match(/mutation:\s*(\w+)/);
      const subscriptionMatch = schemaContent.match(/subscription:\s*(\w+)/);

      if (queryMatch) info.queryType = queryMatch[1];
      if (mutationMatch) info.mutationType = mutationMatch[1];
      if (subscriptionMatch) info.subscriptionType = subscriptionMatch[1];
    }

    // Extract types
    const typeMatches = schema.match(/type\s+(\w+)/g);
    if (typeMatches) {
      info.types = typeMatches.map((match) => match.replace('type ', ''));
    }

    // Extract enums
    const enumMatches = schema.match(/enum\s+(\w+)/g);
    if (enumMatches) {
      info.enums = enumMatches.map((match) => match.replace('enum ', ''));
    }

    // Extract directives
    const directiveMatches = schema.match(/directive\s+@(\w+)/g);
    if (directiveMatches) {
      info.directives = directiveMatches.map((match) => match.replace('directive @', ''));
    }

    return info;
  };

  const schemaInfo = parseSchemaInfo(cleanedSchema);

  return (
    <div className="space-y-4">
      <div className="mb-3 text-sm font-semibold text-text-primary">GraphQL Schema (SDL)</div>

      {/* Schema Overview */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {schemaInfo.queryType && (
          <div className="rounded-lg border border-green-600/20 bg-green-600/10 p-3">
            <div className="mb-1 text-xs font-medium text-green-400">Query Type</div>
            <div className="font-mono text-sm text-text-primary">{schemaInfo.queryType}</div>
          </div>
        )}

        {schemaInfo.mutationType && (
          <div className="rounded-lg border border-orange-600/20 bg-orange-600/10 p-3">
            <div className="mb-1 text-xs font-medium text-orange-400">Mutation Type</div>
            <div className="font-mono text-sm text-text-primary">{schemaInfo.mutationType}</div>
          </div>
        )}

        {schemaInfo.subscriptionType && (
          <div className="rounded-lg border border-purple-600/20 bg-purple-600/10 p-3">
            <div className="mb-1 text-xs font-medium text-purple-400">Subscription Type</div>
            <div className="font-mono text-sm text-text-primary">{schemaInfo.subscriptionType}</div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-surface-secondary p-3 text-center">
          <div className="text-lg font-bold text-blue-400">{schemaInfo.types.length}</div>
          <div className="text-xs text-text-secondary">Types</div>
        </div>
        <div className="rounded-lg bg-surface-secondary p-3 text-center">
          <div className="text-lg font-bold text-yellow-400">{schemaInfo.enums.length}</div>
          <div className="text-xs text-text-secondary">Enums</div>
        </div>
        <div className="rounded-lg bg-surface-secondary p-3 text-center">
          <div className="text-lg font-bold text-purple-400">{schemaInfo.directives.length}</div>
          <div className="text-xs text-text-secondary">Directives</div>
        </div>
        <div className="rounded-lg bg-surface-secondary p-3 text-center">
          <div className="text-lg font-bold text-green-400">{cleanedSchema.split('\n').length}</div>
          <div className="text-xs text-text-secondary">Lines</div>
        </div>
      </div>

      {/* Types List */}
      {schemaInfo.types.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-sm font-medium text-text-secondary">Available Types:</div>
          <div className="flex flex-wrap gap-2">
            {schemaInfo.types.slice(0, 20).map((type, index) => (
              <span key={index} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">
                {type}
              </span>
            ))}
            {schemaInfo.types.length > 20 && (
              <span className="rounded bg-surface-secondary px-2 py-1 text-xs text-text-secondary">
                +{schemaInfo.types.length - 20} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Enums List */}
      {schemaInfo.enums.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-sm font-medium text-text-secondary">Enums:</div>
          <div className="flex flex-wrap gap-2">
            {schemaInfo.enums.map((enumType, index) => (
              <span key={index} className="rounded bg-yellow-600 px-2 py-1 text-xs text-white">
                {enumType}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw Schema Display */}
      <div>
        <div className="mb-2 text-sm font-medium text-text-secondary">Schema Definition:</div>
        <div
          className="rounded-lg border bg-surface-tertiary p-3 text-xs text-text-primary"
          style={{
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          <pre
            className="m-0 whitespace-pre-wrap break-words font-mono"
            style={{ overflowWrap: 'break-word' }}
          >
            <code>{cleanedSchema}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function QueryDisplay({ data }: { data: any }) {
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
          <div className="mb-2 text-xs font-medium text-text-secondary">Parameters:</div>
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

export default function ToolCallInfo({
  input,
  output,
  domain,
  function_name,
  pendingAuth,
}: {
  input: string;
  function_name: string;
  output?: string | null;
  domain?: string;
  pendingAuth?: boolean;
}) {
  const localize = useLocalize();

  const formatText = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      // Default JSON formatting for non-GraphQL content
      return JSON.stringify(parsed, null, 2);
    } catch {
      return text;
    }
  };

  // Check if input contains GraphQL query that should be rendered specially
  const getGraphQLQueryData = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.query &&
        typeof parsed.query === 'string'
      ) {
        return parsed;
      }
    } catch {
      // Not valid JSON, continue with normal rendering
    }
    return null;
  };

  // Check if output contains tabular data that should be rendered as table
  const getTabularData = (text: string | null) => {
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

  // Check if output contains GraphQL schema introspection data
  const getGraphQLSchemaData = (text: string | null | undefined) => {
    if (!text) return null;

    try {
      const parsed = JSON.parse(text);

      // Check if this looks like a GraphQL schema introspection result
      const hasSchemaStructure =
        parsed.__schema ||
        (parsed.data && parsed.data.__schema) ||
        (parsed.types && Array.isArray(parsed.types)) ||
        parsed.queryType ||
        parsed.mutationType ||
        parsed.subscriptionType;

      if (hasSchemaStructure) {
        return parsed;
      }

      // Check if this is an array of objects with type "text" containing schema data
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type === 'text') {
        try {
          const innerData = JSON.parse(parsed[0].text);
          const hasInnerSchemaStructure =
            innerData.__schema ||
            (innerData.data && innerData.data.__schema) ||
            (innerData.types && Array.isArray(innerData.types)) ||
            innerData.queryType ||
            innerData.mutationType ||
            innerData.subscriptionType;

          if (hasInnerSchemaStructure) {
            return innerData;
          }
        } catch {
          // Not parseable inner JSON, continue with normal rendering
        }
      }
    } catch {
      // Not valid JSON, continue with normal rendering
    }

    return null;
  };

  // Check if output contains GraphQL SDL (Schema Definition Language) text
  const getGraphQLSDLData = (text: string | null | undefined) => {
    if (!text) return null;

    try {
      const parsed = JSON.parse(text);

      // Check if this is an array of objects with type "text" containing SDL
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed[0].type === 'text' &&
        parsed[0].text
      ) {
        const schemaText = parsed[0].text;
        if (schemaText.includes('schema') && schemaText.includes('type')) {
          return parsed;
        }
      }

      // Check if this has a text property with SDL
      if (parsed.text && typeof parsed.text === 'string') {
        const schemaText = parsed.text;
        if (schemaText.includes('schema') && schemaText.includes('type')) {
          return parsed;
        }
      }
    } catch {
      // Not valid JSON, continue with normal rendering
    }

    return null;
  };

  const graphqlQueryData = getGraphQLQueryData(input);
  const tabularData = getTabularData(output ?? null);
  const graphqlSchemaData = getGraphQLSchemaData(output);
  const graphqlSDLData = getGraphQLSDLData(output);

  let title =
    domain != null && domain
      ? localize('com_assistants_domain_info', { 0: domain })
      : localize('com_assistants_function_use', { 0: function_name });
  if (pendingAuth === true) {
    title =
      domain != null && domain
        ? localize('com_assistants_action_attempt', { 0: domain })
        : localize('com_assistants_attempt_info');
  }

  return (
    <div className="w-full p-2">
      <div style={{ opacity: 1 }}>
        <div className="mb-2 text-sm font-medium text-text-primary">{title}</div>
        <div>
          {graphqlQueryData ? (
            <QueryDisplay data={graphqlQueryData} />
          ) : (
            <OptimizedCodeBlock text={formatText(input)} maxHeight={250} />
          )}
        </div>
        {output && (
          <>
            <div className="my-2 text-sm font-medium text-text-primary">
              {localize('com_ui_result')}
            </div>
            <div>
              {graphqlSchemaData ? (
                <GraphQLSchemaDisplay data={graphqlSchemaData} />
              ) : graphqlSDLData ? (
                <GraphQLSDLDisplay data={graphqlSDLData} />
              ) : tabularData ? (
                <DataTable data={tabularData} />
              ) : (
                <OptimizedCodeBlock text={formatText(output)} maxHeight={250} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
