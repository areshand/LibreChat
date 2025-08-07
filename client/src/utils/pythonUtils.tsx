import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { OptimizedCodeBlock } from './displayUtils';
import { langSubset } from './languages';

// Check if input contains Python code that should be rendered specially
export const getPythonCodeData = (text: string) => {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && parsed.code && typeof parsed.code === 'string') {
      // Check if it looks like Python code
      const code = parsed.code;
      if (
        code.includes('import ') ||
        code.includes('def ') ||
        code.includes('print(') ||
        code.includes('plt.') ||
        code.includes('np.') ||
        code.includes('pd.') ||
        code.includes('=') ||
        /^\s*#/.test(code) // Starts with comment
      ) {
        return { ...parsed, language: 'python' };
      }
    }
  } catch {
    // Not valid JSON, continue with normal rendering
  }
  return null;
};

export function PythonCodeDisplay({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Check if this looks like Python code data
  if (!data.code || typeof data.code !== 'string') {
    return null;
  }

  // Format the Python code for display
  const formattedCode = data.code
    .replace(/\\n/g, '\n') // Replace escaped newlines with actual newlines
    .replace(/\\"/g, '"') // Replace escaped quotes with actual quotes
    .replace(/\\t/g, '  '); // Replace escaped tabs with spaces

  // Create display object with other properties
  const otherProps = Object.keys(data)
    .filter((key) => key !== 'code')
    .reduce((acc, key) => {
      acc[key] = data[key];
      return acc;
    }, {} as any);

  // Create markdown code block for syntax highlighting
  const markdownCode = `\`\`\`python\n${formattedCode}\n\`\`\``;

  // Configure rehype-highlight with the same settings as the main Markdown component
  const rehypePlugins = [
    [
      rehypeHighlight,
      {
        detect: true,
        ignoreMissing: true,
        subset: langSubset,
      },
    ],
  ] as any;

  return (
    <div className="space-y-3">
      {Object.keys(otherProps).length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium text-text-secondary">{'Parameters:'}</div>
          <OptimizedCodeBlock text={JSON.stringify(otherProps, null, 2)} maxHeight={150} />
        </div>
      )}
      <div>
        <div className="mb-2 text-xs font-medium text-text-secondary">{'Python Code:'}</div>
        <div
          className="overflow-auto rounded-lg bg-surface-tertiary"
          style={{
            maxHeight: 400,
          }}
        >
          <ReactMarkdown
            rehypePlugins={rehypePlugins}
            components={{
              pre: ({ children, ...props }) => (
                <pre
                  {...props}
                  className="m-0 overflow-x-auto p-3 text-xs"
                  style={{ overflowWrap: 'break-word' }}
                >
                  {children}
                </pre>
              ),
              code: ({ children, className, ...props }) => (
                <code {...props} className={`${className} font-mono`}>
                  {children}
                </code>
              ),
            }}
          >
            {markdownCode}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// Check if output contains Python MCP tool result
export const getPythonResultData = (text: string | null | undefined) => {
  console.log(
    'getPythonResultData - CALLED with text:',
    text ? text.substring(0, 100) + '...' : 'null/undefined',
  );

  if (!text) {
    console.log('getPythonResultData - returning null: no text');
    return null;
  }

  // First, check if the text contains Python result patterns before parsing
  // Handle both direct and escaped JSON patterns
  const hasPythonResultPattern =
    (text.includes('"success"') || text.includes('\\"success\\"')) &&
    (text.includes('"plot"') ||
      text.includes('\\"plot\\"') ||
      text.includes('"output"') ||
      text.includes('\\"output\\"') ||
      text.includes('"error"') ||
      text.includes('\\"error\\"'));

  console.log('getPythonResultData - hasPythonResultPattern:', hasPythonResultPattern);

  if (!hasPythonResultPattern) {
    console.log('getPythonResultData - returning null: no Python result pattern');
    return null;
  }

  // Add debugging
  console.log('getPythonResultData - input text:', text.substring(0, 300) + '...');

  try {
    const parsed = JSON.parse(text);
    console.log('getPythonResultData - parsed JSON:', parsed);

    // Check if this is an array with nested JSON (common format from MCP servers)
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log('getPythonResultData - found array format, first element:', parsed[0]);

      // Handle the case where it's an array of objects with type and text
      if (parsed[0].type === 'text' && parsed[0].text) {
        console.log('getPythonResultData - found nested text format');
        console.log(
          'getPythonResultData - inner text (first 200 chars):',
          parsed[0].text.substring(0, 200),
        );

        try {
          // The inner text might have escaped characters, so we need to handle that
          let innerText = parsed[0].text;

          // Try to parse the inner JSON directly first
          let innerData;
          try {
            console.log('getPythonResultData - attempting direct parse of inner text');
            innerData = JSON.parse(innerText);
            console.log('getPythonResultData - direct parse successful:', innerData);
          } catch (directParseError) {
            console.log('getPythonResultData - direct parse failed:', directParseError);
            console.log('getPythonResultData - attempting to clean escaped characters');

            // If direct parsing fails, try to clean up escaped characters
            innerText = innerText
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\');

            console.log(
              'getPythonResultData - cleaned text (first 200 chars):',
              innerText.substring(0, 200),
            );
            innerData = JSON.parse(innerText);
            console.log('getPythonResultData - cleaned parse successful:', innerData);
          }

          if (
            innerData &&
            typeof innerData === 'object' &&
            innerData.success !== undefined &&
            (innerData.output !== undefined ||
              innerData.error !== undefined ||
              innerData.plot !== undefined)
          ) {
            console.log(
              'getPythonResultData - validated Python result structure, returning:',
              innerData,
            );
            return innerData;
          } else {
            console.log(
              'getPythonResultData - inner data does not match Python result structure:',
              innerData,
            );
          }
        } catch (innerParseError) {
          console.log(
            'getPythonResultData - failed to parse nested JSON after cleanup:',
            innerParseError,
          );
        }
      }
      // Handle the case where it's a direct array of result objects
      else if (parsed[0].success !== undefined) {
        console.log(
          'getPythonResultData - found direct array format with Python result:',
          parsed[0],
        );
        return parsed[0];
      }
    }

    // Check if this looks like a direct Python MCP tool result
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.success !== undefined &&
      (parsed.output !== undefined || parsed.error !== undefined || parsed.plot !== undefined)
    ) {
      console.log('getPythonResultData - found direct Python result data:', parsed);
      return parsed;
    }
  } catch (parseError) {
    console.log('getPythonResultData - initial JSON parsing failed:', parseError);

    // If JSON parsing fails, try to extract and fix the JSON
    try {
      // Sometimes the JSON might be malformed or truncated, try to fix common issues
      let cleanedText = text.trim();
      console.log('getPythonResultData - attempting fallback parsing on cleaned text');

      // Check if it starts with an array bracket and contains the nested structure
      if (cleanedText.startsWith('[') && cleanedText.includes('"type":"text"')) {
        console.log('getPythonResultData - attempting regex extraction from array format');
        // Try to extract just the inner JSON from the text field using a more robust approach

        // Find the start of the text field value
        const textFieldStart = cleanedText.indexOf('"text":"') + 8; // 8 = length of '"text":"'
        if (textFieldStart > 7) {
          // Make sure we found it
          // Find the end by looking for the closing quote that's not escaped
          let textFieldEnd = textFieldStart;
          let escapeCount = 0;

          for (let i = textFieldStart; i < cleanedText.length; i++) {
            if (cleanedText[i] === '\\') {
              escapeCount++;
            } else if (cleanedText[i] === '"' && escapeCount % 2 === 0) {
              textFieldEnd = i;
              break;
            } else if (cleanedText[i] !== '\\') {
              escapeCount = 0;
            }
          }

          if (textFieldEnd > textFieldStart) {
            let extractedJson = cleanedText.substring(textFieldStart, textFieldEnd);
            console.log(
              'getPythonResultData - extracted JSON (first 200 chars):',
              extractedJson.substring(0, 200),
            );

            // Unescape the JSON string
            extractedJson = extractedJson
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\');

            console.log(
              'getPythonResultData - unescaped JSON (first 200 chars):',
              extractedJson.substring(0, 200),
            );
            const innerData = JSON.parse(extractedJson);
            if (innerData && typeof innerData === 'object' && innerData.success !== undefined) {
              console.log(
                'getPythonResultData - successfully parsed extracted Python result data:',
                innerData,
              );
              return innerData;
            }
          }
        }
      }

      // Ensure it starts and ends with braces for direct JSON
      if (cleanedText.startsWith('{')) {
        console.log('getPythonResultData - attempting direct JSON cleanup');
        // If it doesn't end with }, try to find where it should end
        if (!cleanedText.endsWith('}')) {
          // Look for the last occurrence of a complete field
          const lastCompleteField = cleanedText.lastIndexOf('"}');
          if (lastCompleteField !== -1) {
            cleanedText = cleanedText.substring(0, lastCompleteField + 2) + '}';
          } else {
            // Try to add closing brace
            cleanedText += '}';
          }
        }

        console.log('getPythonResultData - attempting to parse cleaned direct JSON');
        const reparsed = JSON.parse(cleanedText);
        if (reparsed && typeof reparsed === 'object' && reparsed.success !== undefined) {
          console.log(
            'getPythonResultData - successfully parsed cleaned Python result data:',
            reparsed,
          );
          return reparsed;
        }
      }
    } catch (secondParseError) {
      // If all parsing attempts fail, return null to fall back to default rendering
      console.warn(
        'getPythonResultData - failed to parse Python result data after cleanup:',
        secondParseError,
      );
    }
  }

  console.log(
    'getPythonResultData - Python result data detection failed, falling back to default rendering',
  );
  return null;
};

export function PythonResultDisplay({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Check if this looks like a Python MCP tool result
  const isPythonResult =
    data.success !== undefined &&
    (data.output !== undefined || data.error !== undefined || data.plot !== undefined);

  if (!isPythonResult) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Status */}
      <div className="flex items-center gap-2">
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            data.success ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
          }`}
        >
          {data.success ? 'Success' : 'Error'}
        </span>
      </div>

      {/* Error Display */}
      {!data.success && data.error && (
        <div>
          <div className="mb-2 text-xs font-medium text-red-400">{'Error:'}</div>
          <div className="rounded-lg border border-red-600/20 bg-red-600/10 p-3">
            <pre className="m-0 whitespace-pre-wrap break-words font-mono text-xs text-red-300">
              {data.error}
            </pre>
            {data.traceback && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-red-400 hover:text-red-300">
                  {'Show traceback'}
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-red-200">
                  {data.traceback}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Output Display */}
      {data.output && (
        <div>
          <div className="mb-2 text-xs font-medium text-text-secondary">{'Output:'}</div>
          <div className="rounded-lg bg-surface-tertiary p-3">
            <pre className="m-0 whitespace-pre-wrap break-words font-mono text-xs text-text-primary">
              {data.output}
            </pre>
          </div>
        </div>
      )}

      {/* Plot Display */}
      {data.plot && (
        <div>
          <div className="mb-2 text-xs font-medium text-text-secondary">{'Generated Plot:'}</div>
          <div className="rounded-lg bg-surface-tertiary p-3">
            <img
              src={`data:image/png;base64,${data.plot}`}
              alt="Generated plot"
              className="h-auto max-w-full rounded"
              style={{ maxHeight: '400px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
