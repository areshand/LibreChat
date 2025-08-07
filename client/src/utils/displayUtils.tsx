import React from 'react';

// Helper function to render optimized code block
export function OptimizedCodeBlock({
  text,
  maxHeight = 320,
  language,
}: {
  text: string;
  maxHeight?: number;
  language?: string;
}) {
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
        <code className={language}>{text}</code>
      </pre>
    </div>
  );
}
