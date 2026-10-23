import { notFound } from 'next/navigation';

/** Cache Components wants one known value per dynamic route; this one is a 404 like any other. */
export function generateStaticParams() {
    return [{ rest: ['not-found'] }];
}

/** Any URL that is not one of the site's pages gets the 404 page, in the language of the URL. */
export default function UnknownPage() {
    notFound();
}
