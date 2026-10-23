import {
    AppstoreOutlined,
    FileTextOutlined,
    HomeOutlined,
    InboxOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { Authenticated, Refine } from '@refinedev/core';
import { ErrorComponent, ThemedLayout, useNotificationProvider } from '@refinedev/antd';
import routerProvider, { CatchAllNavigate, DocumentTitleHandler, NavigateToResource, UnsavedChangesNotifier } from '@refinedev/react-router';
import { App as AntdApp, ConfigProvider, Skeleton } from 'antd';
import arEG from 'antd/locale/ar_EG';
import { lazy, Suspense, type ComponentType } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';
import '@refinedev/antd/dist/reset.css';
import { Header } from './components/Header';
import { Logo } from './components/Logo';
import { AccountPage } from './pages/account';
import { ApplicationList, ApplicationShow } from './pages/applications';
import { CategoryCreate, CategoryEdit, CategoryList } from './pages/categories';
import { DashboardPage } from './pages/dashboard';
import { JobCreate, JobEdit, JobList } from './pages/jobs';
import { LoginPage } from './pages/login';
import { MessageList, MessageShow } from './pages/messages';
import { ProjectCreate, ProjectEdit, ProjectList } from './pages/projects';
import { ServiceCreate, ServiceEdit, ServiceList } from './pages/services';
import { TestimonialCreate, TestimonialEdit, TestimonialList } from './pages/testimonials';
import { authProvider } from './providers/authProvider';
import { dataProvider } from './providers/dataProvider';
import { i18nProvider } from './providers/i18nProvider';

/** A page loaded when it is first opened (the settings pages, and the article editor). */
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
    return lazy(() => load().then((module) => ({ default: module[name] })));
}

const PostList = page(() => import('./pages/posts'), 'PostList');
const PostCreate = page(() => import('./pages/posts'), 'PostCreate');
const PostEdit = page(() => import('./pages/posts'), 'PostEdit');
const HomeSettings = page(() => import('./pages/settings/HomeSettings'), 'HomeSettings');
const AboutSettings = page(() => import('./pages/settings/AboutSettings'), 'AboutSettings');
const PageTextsSettings = page(() => import('./pages/settings/PageTextsSettings'), 'PageTextsSettings');
const LegalSettings = page(() => import('./pages/settings/LegalSettings'), 'LegalSettings');
const ContactSettings = page(() => import('./pages/settings/ContactSettings'), 'ContactSettings');
const SeoSettings = page(() => import('./pages/settings/SeoSettings'), 'SeoSettings');
const MailSettings = page(() => import('./pages/settings/MailSettings'), 'MailSettings');
const AppearanceSettings = page(() => import('./pages/settings/AppearanceSettings'), 'AppearanceSettings');

/** The menu: the Filament panel's groups and pages, in its order. */
const resources = [
    { name: 'dashboard', list: '/', meta: { label: 'لوحة التحكم', icon: <HomeOutlined /> } },

    { name: 'inbox', meta: { label: 'الوارد', icon: <InboxOutlined /> } },
    { name: 'contact-messages', list: '/contact-messages', show: '/contact-messages/:id', meta: { label: 'رسائل التواصل', parent: 'inbox' } },
    { name: 'job-applications', list: '/job-applications', show: '/job-applications/:id', meta: { label: 'طلبات التوظيف', parent: 'inbox' } },

    { name: 'content', meta: { label: 'المحتوى', icon: <AppstoreOutlined /> } },
    { name: 'projects', list: '/projects', create: '/projects/create', edit: '/projects/:id/edit', meta: { label: 'المشاريع', parent: 'content' } },
    { name: 'project-categories', list: '/project-categories', create: '/project-categories/create', edit: '/project-categories/:id/edit', meta: { label: 'تصنيفات المشاريع', parent: 'content' } },
    { name: 'services', list: '/services', create: '/services/create', edit: '/services/:id/edit', meta: { label: 'الخدمات', parent: 'content' } },
    { name: 'posts', list: '/posts', create: '/posts/create', edit: '/posts/:id/edit', meta: { label: 'المدونة', parent: 'content' } },
    { name: 'job-openings', list: '/job-openings', create: '/job-openings/create', edit: '/job-openings/:id/edit', meta: { label: 'الوظائف', parent: 'content' } },
    { name: 'testimonials', list: '/testimonials', create: '/testimonials/create', edit: '/testimonials/:id/edit', meta: { label: 'آراء العملاء', parent: 'content' } },

    { name: 'pages', meta: { label: 'صفحات الموقع', icon: <FileTextOutlined /> } },
    { name: 'settings-home', list: '/pages/home', meta: { label: 'الصفحة الرئيسية', parent: 'pages' } },
    { name: 'settings-about', list: '/pages/about', meta: { label: 'صفحة من نحن', parent: 'pages' } },
    { name: 'settings-texts', list: '/pages/texts', meta: { label: 'نصوص الصفحات', parent: 'pages' } },
    { name: 'settings-legal', list: '/pages/legal', meta: { label: 'الخصوصية والشروط', parent: 'pages' } },

    { name: 'settings', meta: { label: 'الإعدادات', icon: <SettingOutlined /> } },
    { name: 'settings-contact', list: '/settings/contact', meta: { label: 'بيانات التواصل', parent: 'settings' } },
    { name: 'settings-seo', list: '/settings/seo', meta: { label: 'الظهور في جوجل', parent: 'settings' } },
    { name: 'settings-mail', list: '/settings/mail', meta: { label: 'البريد والإشعارات', parent: 'settings' } },
    { name: 'settings-appearance', list: '/settings/appearance', meta: { label: 'المظهر والتحميل', parent: 'settings' } },
];

export default function App() {
    return (
        <BrowserRouter basename="/admin">
            <ConfigProvider
                direction="rtl"
                locale={arEG}
                theme={{
                    token: {
                        colorPrimary: '#0B63CE',
                        fontFamily: "'Cairo Variable', system-ui, sans-serif",
                        borderRadius: 10,
                    },
                }}
            >
                <AntdApp>
                    <Refine
                        dataProvider={dataProvider}
                        authProvider={authProvider}
                        i18nProvider={i18nProvider}
                        routerProvider={routerProvider}
                        notificationProvider={useNotificationProvider}
                        resources={resources}
                        options={{ syncWithLocation: true, warnWhenUnsavedChanges: true, disableTelemetry: true }}
                    >
                        <Routes>
                            <Route
                                element={
                                    <Authenticated key="admin" fallback={<CatchAllNavigate to="/login" />}>
                                        <ThemedLayout Header={Header} Title={({ collapsed }) => <Logo collapsed={collapsed} height={collapsed ? 28 : 26} />}>
                                            <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
                                                <Outlet />
                                            </Suspense>
                                        </ThemedLayout>
                                    </Authenticated>
                                }
                            >
                                <Route index element={<DashboardPage />} />

                                <Route path="/contact-messages">
                                    <Route index element={<MessageList />} />
                                    <Route path=":id" element={<MessageShow />} />
                                </Route>
                                <Route path="/job-applications">
                                    <Route index element={<ApplicationList />} />
                                    <Route path=":id" element={<ApplicationShow />} />
                                </Route>

                                <Route path="/projects">
                                    <Route index element={<ProjectList />} />
                                    <Route path="create" element={<ProjectCreate />} />
                                    <Route path=":id/edit" element={<ProjectEdit />} />
                                </Route>
                                <Route path="/project-categories">
                                    <Route index element={<CategoryList />} />
                                    <Route path="create" element={<CategoryCreate />} />
                                    <Route path=":id/edit" element={<CategoryEdit />} />
                                </Route>
                                <Route path="/services">
                                    <Route index element={<ServiceList />} />
                                    <Route path="create" element={<ServiceCreate />} />
                                    <Route path=":id/edit" element={<ServiceEdit />} />
                                </Route>
                                <Route path="/posts">
                                    <Route index element={<PostList />} />
                                    <Route path="create" element={<PostCreate />} />
                                    <Route path=":id/edit" element={<PostEdit />} />
                                </Route>
                                <Route path="/job-openings">
                                    <Route index element={<JobList />} />
                                    <Route path="create" element={<JobCreate />} />
                                    <Route path=":id/edit" element={<JobEdit />} />
                                </Route>
                                <Route path="/testimonials">
                                    <Route index element={<TestimonialList />} />
                                    <Route path="create" element={<TestimonialCreate />} />
                                    <Route path=":id/edit" element={<TestimonialEdit />} />
                                </Route>

                                <Route path="/pages/home" element={<HomeSettings />} />
                                <Route path="/pages/about" element={<AboutSettings />} />
                                <Route path="/pages/texts" element={<PageTextsSettings />} />
                                <Route path="/pages/legal" element={<LegalSettings />} />
                                <Route path="/settings/contact" element={<ContactSettings />} />
                                <Route path="/settings/seo" element={<SeoSettings />} />
                                <Route path="/settings/mail" element={<MailSettings />} />
                                <Route path="/settings/appearance" element={<AppearanceSettings />} />
                                <Route path="/account" element={<AccountPage />} />

                                <Route path="*" element={<ErrorComponent />} />
                            </Route>

                            <Route
                                element={
                                    <Authenticated key="login" fallback={<Outlet />}>
                                        <NavigateToResource resource="dashboard" />
                                    </Authenticated>
                                }
                            >
                                <Route path="/login" element={<LoginPage />} />
                            </Route>
                        </Routes>

                        <UnsavedChangesNotifier />
                        <DocumentTitleHandler handler={() => 'لوحة تحكم كودلك'} />
                    </Refine>
                </AntdApp>
            </ConfigProvider>
        </BrowserRouter>
    );
}
