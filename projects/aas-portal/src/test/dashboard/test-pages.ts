/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DashboardChart, DashboardChartType, DashboardItemType } from '../../app/dashboard/dashboard.store';
import { maxRotationSpeed, rotationSpeed, torque } from '../../test/assets/sample-document';

export const pages = [
    {
        name: 'Dashboard 1',
        items: [],
        requests: [],
    },
    {
        name: 'Test',
        items: [
            {
                label: 'Chart 1',
                chartType: DashboardChartType.Line,
                id: '42',
                sources: [
                    {
                        color: '#123456',
                        label: 'RotationSpeed',
                        node: null,
                        element: rotationSpeed,
                    },
                ],
                positions: [{ x: 0, y: 0 }],
                type: DashboardItemType.Chart,
            } as DashboardChart,
            {
                label: 'Chart 2',
                chartType: DashboardChartType.Line,
                id: '4711',
                sources: [
                    {
                        color: '#654321',
                        label: 'Torque',
                        node: null,
                        element: torque,
                    },
                ],
                positions: [{ x: 1, y: 0 }],
                type: DashboardItemType.Chart,
            } as DashboardChart,
            {
                label: 'Chart 3',
                chartType: DashboardChartType.Line,
                id: '0815',
                sources: [
                    {
                        color: '#987654',
                        label: 'MaxRotationSpeed',
                        node: null,
                        element: maxRotationSpeed,
                    },
                ],
                positions: [{ x: 0, y: 1 }],
                type: DashboardItemType.Chart,
            } as DashboardChart,
        ],
        requests: [],
    },
];
