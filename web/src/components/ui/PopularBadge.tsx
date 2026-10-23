/** The "most requested" badge on a service picture. */
export function PopularBadge({ children }: { children: React.ReactNode }) {
    return (
        <span className="absolute end-3 top-3 rounded-full border border-accent-line bg-surface px-3 py-0.5 text-[13px] font-extrabold text-accent-ink">
            {children}
        </span>
    );
}
