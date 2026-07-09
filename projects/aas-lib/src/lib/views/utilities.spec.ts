/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, expect, it } from 'vitest';
import { aas } from 'aas-core';
import { NAMEPLATE_3_0, CARBON_FOOTPRINT_1_0, HANDOVER_DOCUMENTATION_2_0 } from './views-constants';
import { findRouteForShell, findRouteForSubmodel, hasSpecificView } from '../utilities';
import { viewRoutes } from './view-route-config';

describe('utilities', () => {
    describe('findRouteForSubmodel', () => {
        it('should has a Nameplate route', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'Nameplate',
                modelType: 'Submodel',
                semanticId: {
                    keys: [
                        {
                            type: 'GlobalReference',
                            value: NAMEPLATE_3_0,
                        },
                    ],
                    type: 'ExternalReference',
                },
            };

            expect(findRouteForSubmodel(viewRoutes, submodel)?.path).toEqual('Nameplate');
        });

        it('has no specific route for "Unknown"', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'Nameplate',
                modelType: 'Submodel',
                semanticId: {
                    keys: [
                        {
                            type: 'GlobalReference',
                            value: 'http://localhost/unknown',
                        },
                    ],
                    type: 'ExternalReference',
                },
            };

            expect(findRouteForSubmodel(viewRoutes, submodel, false)?.data.type).toBeUndefined();
        });

        it('returns the default route for "Unknown"', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'Nameplate',
                modelType: 'Submodel',
                semanticId: {
                    keys: [
                        {
                            type: 'GlobalReference',
                            value: 'http://localhost/unknown',
                        },
                    ],
                    type: 'ExternalReference',
                },
            };

            expect(findRouteForSubmodel(viewRoutes, submodel)?.data.type).toEqual('Default');
        });

        it('should has a OperationData route', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'OperationalData',
                modelType: 'Submodel',
                semanticId: {
                    keys: [
                        {
                            type: 'GlobalReference',
                            value: 'http://localhost/unknown',
                        },
                    ],
                    type: 'ExternalReference',
                },
            };

            expect(findRouteForSubmodel(viewRoutes, submodel)?.path).toEqual('OperationalData');
        });
    });

    describe('findRouteForShell', () => {
        it('should has a DPP view', () => {
            const env: aas.Environment = {
                assetAdministrationShells: [],
                conceptDescriptions: [],
                submodels: [
                    {
                        id: 'http://localhost/aas/sm/nameplate',
                        idShort: 'Nameplate',
                        modelType: 'Submodel',
                        semanticId: {
                            keys: [
                                {
                                    type: 'GlobalReference',
                                    value: NAMEPLATE_3_0,
                                },
                            ],
                            type: 'ExternalReference',
                        },
                    },
                    {
                        id: 'http://localhost/aas/sm/carbon-footprint',
                        idShort: 'CarbonFootprint',
                        modelType: 'Submodel',
                        semanticId: {
                            keys: [
                                {
                                    type: 'GlobalReference',
                                    value: CARBON_FOOTPRINT_1_0,
                                },
                            ],
                            type: 'ExternalReference',
                        },
                    },
                    {
                        id: 'http://localhost/aas/sm/handover-documentation',
                        idShort: 'HandoverDocumentation',
                        modelType: 'Submodel',
                        semanticId: {
                            keys: [
                                {
                                    type: 'GlobalReference',
                                    value: HANDOVER_DOCUMENTATION_2_0,
                                },
                            ],
                            type: 'ExternalReference',
                        },
                    },
                ],
            };

            const result = findRouteForShell(viewRoutes, env);
            expect(result.route?.path).toEqual('DigitalProductPassport');
            expect(result.map?.Nameplate).toBeDefined();
            expect(result.map?.CarbonFootprint).toBeDefined();
            expect(result.map?.HandoverDocumentation).toBeDefined();
        });

        it('return "Default" while "HandoverDocumentation" missing', () => {
            const env: aas.Environment = {
                assetAdministrationShells: [],
                conceptDescriptions: [],
                submodels: [
                    {
                        id: 'http://localhost/aas/sm/nameplate',
                        idShort: 'Nameplate',
                        modelType: 'Submodel',
                        semanticId: {
                            keys: [
                                {
                                    type: 'GlobalReference',
                                    value: NAMEPLATE_3_0,
                                },
                            ],
                            type: 'ExternalReference',
                        },
                    },
                    {
                        id: 'http://localhost/aas/sm/carbon-footprint',
                        idShort: 'CarbonFootprint',
                        modelType: 'Submodel',
                        semanticId: {
                            keys: [
                                {
                                    type: 'GlobalReference',
                                    value: CARBON_FOOTPRINT_1_0,
                                },
                            ],
                            type: 'ExternalReference',
                        },
                    },
                    {
                        id: 'http://localhost/aas/sm/unknown',
                        idShort: 'Unknown',
                        modelType: 'Submodel',
                        semanticId: {
                            keys: [
                                {
                                    type: 'GlobalReference',
                                    value: 'http://localhost/unknown',
                                },
                            ],
                            type: 'ExternalReference',
                        },
                    },
                ],
            };

            const result = findRouteForShell(viewRoutes, env, false);
            expect(result).toEqual({});
        });
    });

    describe('hasSpecificView', () => {
        it('has a Nameplate view', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'Nameplate',
                modelType: 'Submodel',
                semanticId: {
                    keys: [
                        {
                            type: 'GlobalReference',
                            value: NAMEPLATE_3_0,
                        },
                    ],
                    type: 'ExternalReference',
                },
            };

            expect(hasSpecificView(viewRoutes, submodel)).toBe(true);
        });

        it('has no specific view for "Unknown"', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'Nameplate',
                modelType: 'Submodel',
                semanticId: {
                    keys: [
                        {
                            type: 'GlobalReference',
                            value: 'http://localhost/unknown',
                        },
                    ],
                    type: 'ExternalReference',
                },
            };

            expect(hasSpecificView(viewRoutes, submodel)).toBe(false);
        });

        it('should has a specific OperationData view', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'OperationalData',
                modelType: 'Submodel',
                semanticId: {
                    keys: [
                        {
                            type: 'GlobalReference',
                            value: 'http://localhost/unknown',
                        },
                    ],
                    type: 'ExternalReference',
                },
            };

            expect(hasSpecificView(viewRoutes, submodel)).toBe(true);
        });
    });
});
