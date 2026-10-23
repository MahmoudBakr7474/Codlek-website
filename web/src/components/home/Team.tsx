import type { Schemas } from '@/lib/api';
import type { Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { NamedIconTile } from '../ui/NamedIconTile';
import { SectionHeader } from '../ui/SectionHeader';
import { stepColumns } from './Journey';

/** The roles in the team; as the journey, an odd last role takes the whole row on phones. */
export function Team({ team, t, white }: { team: Schemas['IconCard'][]; t: Translate; white: boolean }) {
    return (
        <section className={cx('py-16 sm:py-24', white && 'border-y border-line bg-surface')}>
            <div className="shell flex flex-col gap-10 sm:gap-12">
                <SectionHeader eyebrow={t('home.team.eyebrow')} title={t('home.team.title')} lead={t('home.team.lead')} />

                <ul className={cx('grid gap-3 sm:gap-4', stepColumns(team.length))}>
                    {team.map((role, i) => (
                        <li
                            key={i}
                            className="flex flex-col items-center gap-2 rounded-box border border-line bg-surface px-4 py-6 text-center max-md:odd:last:col-span-full"
                            data-reveal
                            style={{ '--reveal-delay': `${(i % 7) * 50}ms` } as React.CSSProperties}
                        >
                            <NamedIconTile icon={role.icon} size="lg" />
                            <h3 className="text-[17px] leading-[1.4] font-extrabold">{role.title}</h3>
                            <p className="text-sm leading-[1.5] text-ink-muted">{role.text}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
