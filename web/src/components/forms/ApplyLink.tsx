'use client';

/**
 * "Apply" on a job card: picks the job in the form without reloading the page (what
 * the visitor already typed stays). The link still works without JavaScript.
 */
export function ApplyLink({ jobId, href, describedBy, className, children }: { jobId: number; href: string; describedBy: string; className?: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            aria-describedby={describedBy}
            className={className}
            onClick={(event) => {
                const select = document.getElementById('f-job_opening_id') as HTMLSelectElement | null;
                if (!select) return;
                event.preventDefault();
                select.value = String(jobId);
                document.getElementById('apply')?.scrollIntoView();
                select.focus({ preventScroll: true });
            }}
        >
            {children}
        </a>
    );
}
