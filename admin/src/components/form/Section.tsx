import { Card, Col, Row, Typography } from 'antd';
import type { ReactNode } from 'react';

/**
 * A settings section the Filament way ("aside"): the title and its explanation on
 * one side, the fields in a card beside it; stacked on narrow screens.
 */
export function Section({ title, description, icon, children }: { title: string; description?: ReactNode; icon?: ReactNode; children: ReactNode }) {
    return (
        <Row gutter={[24, 12]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
                <Typography.Title level={5} style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {icon}
                    {title}
                </Typography.Title>
                {description && (
                    <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        {description}
                    </Typography.Paragraph>
                )}
            </Col>
            <Col xs={24} lg={16}>
                <Card>{children}</Card>
            </Col>
        </Row>
    );
}
