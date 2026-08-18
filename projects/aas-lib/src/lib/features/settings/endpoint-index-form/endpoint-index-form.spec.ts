/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { EndpointIndexForm } from './endpoint-index-form';
import { createSpyObj, FakeLoader } from '../../../../test/mocks';
import { IndexChange } from '../../../shared/services/index-change';
import { EndpointsApi } from '../../../shared/services/endpoints-api';
import { lastValueFrom, of, Subject } from 'rxjs';
import { PromptDialog } from '../../../core/prompt-dialog/prompt-dialog';
import { provideRouter } from '@angular/router';

describe('EndpointIndexForm', () => {
    let fixture: ComponentFixture<EndpointIndexForm>;
    let component: EndpointIndexForm;
    let indexChange: Mocked<IndexChange>;
    let api: Mocked<EndpointsApi>;
    let activeModal: Mocked<NgbActiveModal>;
    let modal: Mocked<NgbModal>;
    const progress = signal<{
        endpoint: string;
        start: number;
        progress: number;
        shellCount: number;
        submodelCount: number;
    }>({
        endpoint: '',
        start: 0,
        progress: 0,
        shellCount: 0,
        submodelCount: 0,
    });

    beforeEach(async () => {
        indexChange = createSpyObj<IndexChange>(
            ['clearIndex', 'getUpdateStatus', 'startUpdateIndex', 'cancelUpdateIndex'],
            {
                startUpdate: new Subject<{ endpoint: string; start: number }>(),
                endUpdate: new Subject<{ endpoint: string; start: number }>(),
                cleared: new Subject<string | undefined>(),
                progress: progress.asReadonly(),
            },
        );

        indexChange.getUpdateStatus.mockImplementation((endpoint: string) => {
            if (endpoint === 'endpoint1') {
                return of({
                    name: 'endpoint1',
                    status: 'idle',
                    count: 42,
                    progress: -1,
                    submodelCount: 0,
                });
            }

            return of({
                name: endpoint,
                status: 'scanning',
                start: 123456789,
            });
        });

        activeModal = createSpyObj<NgbActiveModal>(['close']);
        modal = createSpyObj<NgbModal>(['open']);
        api = createSpyObj<EndpointsApi>(['getEndpoints', 'getDocumentCount']);
        api.getEndpoints.mockReturnValue(
            of([
                {
                    type: 'AAS_API',
                    name: 'endpoint1',
                    url: 'http://endpoint1.com',
                    schedule: { type: 'manual' },
                },
                {
                    type: 'AAS_API',
                    name: 'endpoint2',
                    url: 'http://endpoint2.com',
                    schedule: { type: 'manual' },
                },
            ]),
        );

        api.getDocumentCount.mockImplementation((endpoint: string) => {
            if (endpoint === 'endpoint1') {
                return of(42);
            }

            return of(100);
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: NgbModal,
                    useValue: modal,
                },
                {
                    provide: IndexChange,
                    useValue: indexChange,
                },
                {
                    provide: NgbActiveModal,
                    useValue: activeModal,
                },
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideRouter([]),
                provideZonelessChangeDetection(),
            ],
            imports: [EndpointIndexForm],
        }).compileComponents();

        fixture = TestBed.createComponent(EndpointIndexForm);
        component = fixture.componentInstance;
        fixture.whenStable();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should create', () => {
        expect(component).toBeInstanceOf(EndpointIndexForm);
        expect(component.items()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'endpoint1',
                    count: 42,
                    status: 'idle',
                    schedule: 'manual',
                    progress: -1,
                    submodelCount: 0,
                }),
                expect.objectContaining({
                    name: 'endpoint2',
                    count: 100,
                    status: 'scanning',
                    schedule: 'manual',
                    progress: -1,
                    submodelCount: 0,
                }),
            ]),
        );
    });

    it('should close the modal on submit', () => {
        component.submit(new Event('submit'));
        expect(activeModal.close).toHaveBeenCalled();
    });

    it('should clear the index for a specific endpoint', async () => {
        vi.spyOn(PromptDialog, 'confirm').mockResolvedValue('endpoint1');
        indexChange.clearIndex.mockReturnValue(of(void 0));
        await lastValueFrom(component.clearIndex('endpoint1'));
        expect(PromptDialog.confirm).toHaveBeenCalled();

        indexChange.cleared.next('endpoint1');
        expect(component.items()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'endpoint1',
                    count: 0,
                }),
            ]),
        );
    });

    it('should clear the index for all endpoints', async () => {
        vi.spyOn(PromptDialog, 'confirm').mockResolvedValue('EndpointIndexForm.CLEAR_INDEX_KEY');
        indexChange.clearIndex.mockReturnValue(of(void 0));
        await lastValueFrom(component.clearIndex());
        expect(PromptDialog.confirm).toHaveBeenCalled();

        indexChange.cleared.next(undefined);
        expect(component.items()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'endpoint1',
                    count: 0,
                }),
                expect.objectContaining({
                    name: 'endpoint2',
                    count: 0,
                }),
            ]),
        );
    });

    it('should start scanning for a specific endpoint', async () => {
        indexChange.startUpdateIndex.mockReturnValue(of(void 0));
        await lastValueFrom(component.startScan('endpoint1'));
        expect(indexChange.startUpdateIndex).toHaveBeenCalledWith('endpoint1');

        indexChange.startUpdate.next({ endpoint: 'endpoint1', start: Date.now() });
        expect(component.items()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'endpoint1',
                    status: 'scanning',
                }),
            ]),
        );
    });

    it('should cancel scanning for a specific endpoint', async () => {
        indexChange.cancelUpdateIndex.mockReturnValue(of(void 0));
        await lastValueFrom(component.cancelScan('endpoint2'));
        expect(indexChange.cancelUpdateIndex).toHaveBeenCalledWith('endpoint2');

        indexChange.endUpdate.next({ endpoint: 'endpoint2', start: Date.now() });
        expect(component.items()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'endpoint2',
                    status: 'idle',
                }),
            ]),
        );
    });
});
