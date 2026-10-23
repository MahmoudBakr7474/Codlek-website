'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { Texts } from '@/lib/i18n';
import { Button } from '../ui/Button';
import { Field } from './Field';
import { ErrorSummary, Toast } from './FormFeedback';
import { submitForm } from './submit';

type Props = {
    locale: string;
    texts: Texts;
    services: Array<{ key: string; label: string }>;
    preselected?: string;
    privacyHref: string;
};

export function ContactForm({ locale, texts, services, preselected, privacyHref }: Props) {
    const t = (key: string) => texts[key] ?? key;
    const form = useRef<HTMLFormElement>(null);
    const [sending, setSending] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [summary, setSummary] = useState<string | null>(null);
    const [done, setDone] = useState<{ title: string; text: string } | null>(null);

    async function send(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSending(true);
        const data = Object.fromEntries(new FormData(event.currentTarget));
        const result = await submitForm(locale, 'contact', JSON.stringify(data), t('forms.has_errors'));
        setSending(false);

        if (result.ok) {
            setErrors({});
            setSummary(null);
            setDone(result);
            form.current?.reset();
        } else {
            setErrors(result.errors);
            setSummary(result.message);
        }
    }

    return (
        <>
            {summary && <ErrorSummary message={summary} />}

            <form ref={form} onSubmit={send} className="mt-8 space-y-5" noValidate>
                {/* Bots fill this field; people never see it. */}
                <div className="hidden" aria-hidden="true">
                    <label htmlFor="f-website">Website</label>
                    <input type="text" id="f-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <Field name="name" label={t('forms.labels.name')} placeholder={t('forms.placeholders.name')} required autoComplete="name" error={errors.name} />
                    <Field name="email" type="email" label={t('forms.labels.email')} placeholder={t('forms.placeholders.email')} required ltr autoComplete="email" error={errors.email} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
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
                    <Field
                        name="service"
                        type="select"
                        label={t('forms.labels.service')}
                        placeholder={t('forms.select_service')}
                        options={services.map((service) => ({ value: service.key, label: service.label }))}
                        defaultValue={preselected}
                        required
                        error={errors.service}
                    />
                </div>
                <Field name="message" type="textarea" label={t('forms.labels.message')} placeholder={t('forms.placeholders.message')} required error={errors.message} />

                <div className="flex flex-col items-stretch gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[13px] text-ink-muted">
                        {t('forms.privacy_note')}{' '}
                        <Link href={privacyHref} className="rounded-sm font-bold text-primary-ink underline-offset-4 hover:underline">
                            {t('forms.privacy_link')}
                        </Link>
                        .
                    </p>
                    {/* The paper plane points the way the text reads: mirrored in RTL. */}
                    <Button type="submit" size="lg" icon={Send} disabled={sending} aria-busy={sending} className="w-full shrink-0 sm:w-auto sm:min-w-48 rtl:[&>svg:first-child]:-scale-x-100">
                        {sending ? t('forms.sending') : t('forms.submit_contact')}
                    </Button>
                </div>
            </form>

            {done && <Toast title={done.title} text={done.text} closeLabel={t('close')} onClose={() => setDone(null)} />}
        </>
    );
}
