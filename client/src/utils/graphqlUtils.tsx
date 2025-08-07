/* eslint-disable i18next/no-literal-string */
import React from 'react';

// Check if output contains GraphQL schema introspection data
export const getGraphQLSchemaData = (text: string | null | undefined) => {
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

export function GraphQLSchemaDisplay({ data }: { data: any }) {
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
              <div className="mb-1 text-xs font-medium text-text-secondary">{'Fields:'}</div>
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
                    {`... and ${type.fields.length - 10} more fields`}
                  </div>
                )}
              </div>
            </div>
          )}

          {type.enumValues && type.enumValues.length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs font-medium text-text-secondary">{'Enum Values:'}</div>
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

// Check if output contains GraphQL SDL (Schema Definition Language) text
export const getGraphQLSDLData = (text: string | null | undefined) => {
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);

    // Check if this is an array of objects with type "text" containing SDL
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type === 'text' && parsed[0].text) {
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

export function GraphQLSDLDisplay({ data }: { data: any }) {
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
