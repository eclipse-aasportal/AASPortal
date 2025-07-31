import { aas } from 'aas-core';
import {
    findRoute,
    hasSpecificView,
    NAMEPLATE_3_0,
    CARBON_FOOTPRINT_1_0,
    HANDOVER_DOCUMENTATION_2_0,
} from '../../lib/views/views';

describe('views', () => {
    describe('findRoute', () => {
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

            expect(findRoute(submodel)?.path).toEqual('Nameplate');
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

            expect(findRoute(submodel)?.data.type).toEqual('Default');
        });

        it('should has a OperationData route', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'nAMEPLATE',
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
                submodelElements: [
                    {
                        idShort: 'OperationalData',
                        modelType: 'SubmodelElementCollection',
                    } satisfies aas.SubmodelElementCollection,
                ],
            };

            expect(findRoute(submodel)?.path).toEqual('OperationalData');
        });

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

            expect(findRoute(env)?.path).toEqual('DigitalProductPassport');
        });

        xit('return "Default" while "HandoverDocumentation" missing', () => {
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

            expect(findRoute(env)?.data.type).toEqual('Default');
        });
    });

    describe('hasSpecificView', () => {
        it('has a Nameplate view', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'nAMEPLATE',
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

            expect(hasSpecificView(submodel)).toBeTrue();
        });

        it('has no specific view for "Unknown"', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'nAMEPLATE',
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

            expect(hasSpecificView(submodel)).toBeFalse();
        });

        it('should has a specific OperationData view', () => {
            const submodel: aas.Submodel = {
                id: 'http://localhost/aas/sm/nameplate',
                idShort: 'nAMEPLATE',
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
                submodelElements: [
                    {
                        idShort: 'OperationalData',
                        modelType: 'SubmodelElementCollection',
                    } satisfies aas.SubmodelElementCollection,
                ],
            };

            expect(hasSpecificView(submodel)).toBeTrue();
        });
    });
});
