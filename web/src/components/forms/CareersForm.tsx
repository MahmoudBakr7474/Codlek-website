'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { FileCheck, FileUp, Send } from 'lucide-react';
import type { Texts } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { Button } from '../ui/Button';
import { Field, FieldError } from './Field';
import { ErrorSummary, Toast } from './FormFeedback';
import { submitForm } from './submit';

const MAX_CV = 5 * 1024 * 1024;

type Props = {
    locale: string;
    texts: Texts;
    jobs: Array<{ id: number; title: string }>;
    selectedJob?: string;
    privacyHref: string;
};

export function CareersForm({ locale, texts, jobs, selectedJob, privacyHref }: Props) {
    const t = (key: string) => texts[key] ?? key;
    const form = useRef<HTMLFormElement>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const [sending, setSending] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [summary, setSummary] = useState<string | null>(null);
    const [done, setDone] = useState<{ title: string; text: string } | null>(null);
    const [fileName, setFileName] = useState('');
    const [fileError, setFileError] = useState('');
    const hasJobs = jobs.length > 0;

    // The server's message about the last file stays until another file is chosen.
    const cvError = fileError || errors.cv;

    function choose(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        setFileError('');
        setErrors(({ cv: _drop, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
        // Files over 5 MB are refused here, before a long upload that would fail.
        if (file && file.size > MAX_CV) {
            event.target.value = '';
            setFileName('');
            setFileError(t('forms.cv_too_big'));
            return;
        }
        setFileName(file?.name ?? '');
    }

    async function send(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSending(true);
        const result = await submitForm(locale, 'careers', new FormData(event.currentTarget), t('forms.has_errors'));
        setSending(false);

        if (result.ok) {
            setErrors({});
            setSummary(null);
            setDone(result);
            setFileName('');
            form.current?.reset();
        } else {
            setErrors(result.errors);
            setSummary(result.message);
        }
    }

    return (
        <>
            {summary && <ErrorSummary message={summary} />}

            <form ref={form} onSubmit={send} className="mt-7 space-y-5" noValidate>
                <div className="hidden" aria-hidden="true">
                    <label htmlFor="f-website">Website</label>
                    <input type="text" id="f-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>

                {/* Pairs side by side when the form is wide; one column beside the job list. */}
                <div className={cx('grid gap-5 md:grid-cols-2', hasJobs && 'lg:grid-cols-1')}>
                    <Field name="name" label={t('forms.labels.name')} placeholder={t('forms.placeholders.name')} required autoComplete="name" error={errors.name} />
                    <Field name="email" type="email" label={t('forms.labels.email')} placeholder={t('forms.placeholders.email')} required ltr autoComplete="email" error={errors.email} />
                </div>
                <div className={cx('grid gap-5', hasJobs && 'md:grid-cols-2 lg:grid-cols-1')}>
                    <Field
                        name="phone"
                        type="tel"
                        label={t('forms.labels.phone')}
                        placeholder={t('forms.placeholders.phone')}
                        hint={t('forms.phone_hint')}
                        required
                        ltr
                        autoComplete="tel"
                        error={errors.phone}
                    />
                    {hasJobs && (
                        <Field
                            name="job_opening_id"
                            type="select"
                            label={t('forms.labels.job')}
                            options={[{ value: '', label: t('careers.general') }, ...jobs.map((job) => ({ value: String(job.id), label: job.title }))]}
                            defaultValue={selectedJob ?? ''}
                            error={errors.job_opening_id}
                        />
                    )}
                </div>

                {/* CV upload: the real input sits inside the styled label, so the label can show the keyboard focus ring. */}
                <div>
                    <span id="f-cv-label" className="mb-2 block text-sm font-semibold text-ink">
                        {t('forms.labels.cv')}
                    </span>
                    <label
                        data-invalid={cvError ? '' : undefined}
                        className="group flex cursor-pointer items-center gap-4 rounded-box border-[1.5px] border-dashed border-line-input bg-surface-muted p-4 transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary hover:bg-primary-soft has-[:focus-visible]:border-primary has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20 data-invalid:border-accent-ink data-invalid:has-[:focus-visible]:ring-accent/20"
                    >
                        <input
                            ref={fileInput}
                            id="f-cv"
                            name="cv"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="sr-only"
                            onChange={choose}
                            aria-labelledby="f-cv-label"
                            aria-describedby={cx('f-cv-hint', cvError && 'f-cv-error')}
                            aria-invalid={cvError ? true : undefined}
                        />
                        <span className="grid size-11 shrink-0 place-items-center rounded-btn bg-surface text-primary-ink shadow-xs ring-1 ring-line" aria-hidden="true">
                            {fileName ? <FileCheck className="size-[22px] text-teal" /> : <FileUp className="size-[22px]" />}
                        </span>
                        <span className="min-w-0">
                            {/* A long file name is cut with an ellipsis; the prompt wraps evenly. */}
                            <span className={cx('block text-[15px] font-bold text-balance text-ink', fileName && 'truncate')}>{fileName || t('forms.cv_choose')}</span>
                            <span id="f-cv-hint" className="mt-0.5 block text-[13px] text-ink-muted">
                                {t('forms.cv_hint')}
                            </span>
                        </span>
                    </label>
                    {cvError && <FieldError id="f-cv-error">{cvError}</FieldError>}
                </div>

                <Field name="profile_url" type="url" label={t('forms.labels.profile_url')} placeholder={t('forms.placeholders.profile_url')} ltr error={errors.profile_url} />
                <Field name="message" type="textarea" rows={4} label={t('forms.labels.about_you')} placeholder={t('forms.placeholders.about_you')} error={errors.message} />

                <div className="space-y-3 border-t border-line pt-6">
                    <Button type="submit" size="lg" icon={Send} disabled={sending} aria-busy={sending} className="w-full rtl:[&>svg:first-child]:-scale-x-100">
                        {sending ? t('forms.sending') : t('forms.submit_apply')}
                    </Button>
                    <p className="text-center text-[13px] text-ink-muted">
                        {t('forms.privacy_note')}{' '}
                        <Link href={privacyHref} className="rounded-sm font-bold text-primary-ink underline-offset-4 hover:underline">
                            {t('forms.privacy_link')}
                        </Link>
                        .
                    </p>
                </div>
            </form>

            {done && <Toast title={done.title} text={done.text} closeLabel={t('close')} onClose={() => setDone(null)} />}
        </>
    );
}
