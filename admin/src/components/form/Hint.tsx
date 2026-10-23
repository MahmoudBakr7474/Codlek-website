import { Fragment } from 'react';

/**
 * Help text where tokens such as ":service", "{years}" or "#0B63CE" stay readable
 * inside Arabic (left alone, their punctuation jumps to the other side).
 */
export function Hint({ text }: { text: string }) {
    const parts = text.split(/(:[a-z_]+|\{[a-z_]+\}\+?|#[0-9A-Fa-f]{6}|https?:\/\/\S+|\b[\w.+-]+@[\w.-]+\b|[0-9][0-9×x/.+]*[0-9+%])/g);
    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <bdi key={i} dir="ltr" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.92em' }}>
                        {part}
                    </bdi>
                ) : (
                    <Fragment key={i}>{part}</Fragment>
                ),
            )}
        </>
    );
}
