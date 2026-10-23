import type { DataProvider } from '@refinedev/core';
import { API, api } from '../lib/http';

type Page<T> = { data: T[]; total: number };

/*
 * The admin API's list contract: GET /{resource}?page&pageSize&sort&order&q plus
 * one query parameter per filter; answers { data, total }. The search box is the
 * "q" filter. meta.patch on update sends a PATCH (the on/off switches in lists).
 */
export const dataProvider: DataProvider = {
    getApiUrl: () => API,

    getList: async ({ resource, pagination, sorters, filters }) => {
        const query: Record<string, string | number | undefined> = {};
        if (pagination?.mode !== 'off') {
            query.page = pagination?.currentPage ?? 1;
            query.pageSize = pagination?.pageSize ?? 20;
        } else {
            query.pageSize = 200;
        }

        const sorter = sorters?.[0];
        if (sorter) {
            query.sort = sorter.field;
            query.order = sorter.order;
        }

        for (const filter of filters ?? []) {
            if ('field' in filter && filter.value !== undefined && filter.value !== null && filter.value !== '') {
                query[filter.field] = Array.isArray(filter.value) ? filter.value[0] : String(filter.value);
            }
        }

        const page = await api<Page<never>>(`/${resource}`, { query });
        return { data: page.data, total: page.total };
    },

    getOne: async ({ resource, id }) => ({ data: await api(`/${resource}/${id}`) }),

    getMany: async ({ resource, ids }) => ({ data: await Promise.all(ids.map((id) => api(`/${resource}/${id}`))) as never }),

    create: async ({ resource, variables }) => ({ data: await api(`/${resource}`, { method: 'POST', body: variables }) }),

    update: async ({ resource, id, variables, meta }) => ({
        data: await api(`/${resource}/${id}`, { method: meta?.patch ? 'PATCH' : 'PUT', body: variables }),
    }),

    deleteOne: async ({ resource, id }) => {
        await api(`/${resource}/${id}`, { method: 'DELETE' });
        return { data: { id } as never };
    },

    custom: async ({ url, method, payload, query }) => ({
        data: await api(url.replace(API, ''), {
            method: method.toUpperCase() as 'GET',
            body: payload,
            query: query as Record<string, string>,
        }),
    }),
};
