import React from 'react';
import { useLocalize } from '~/hooks';
import { getGraphQLQueryData, QueryDisplay } from '~/utils/queryUtils';
import {
  getPythonCodeData,
  PythonCodeDisplay,
  getPythonResultData,
  PythonResultDisplay,
} from '~/utils/pythonUtils';
import {
  getGraphQLSchemaData,
  GraphQLSchemaDisplay,
  getGraphQLSDLData,
  GraphQLSDLDisplay,
} from '~/utils/graphqlUtils';
import { getTabularData, DataTable } from '~/utils/dataUtils';
import { OptimizedCodeBlock } from '~/utils/displayUtils';

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

  const graphqlQueryData = getGraphQLQueryData(input);
  const pythonCodeData = getPythonCodeData(input);
  const tabularData = getTabularData(output ?? null);
  const graphqlSchemaData = getGraphQLSchemaData(output);
  const graphqlSDLData = getGraphQLSDLData(output);

  // Add debugging for output parameter
  console.log(
    'ToolCallInfo - output parameter:',
    output ? output.substring(0, 200) + '...' : 'null/undefined',
  );
  console.log('ToolCallInfo - output type:', typeof output);

  const pythonResultData = getPythonResultData(output);

  // Add debugging for pythonResultData result
  console.log('ToolCallInfo - pythonResultData result:', pythonResultData);

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
          ) : pythonCodeData ? (
            <PythonCodeDisplay data={pythonCodeData} />
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
              {pythonResultData ? (
                <PythonResultDisplay data={pythonResultData} />
              ) : graphqlSchemaData ? (
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
