/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../lib/components/auth/auth.service';
import {
    START_TILE_TYPES,
    START_TILES,
    StartService,
    StartTile,
    StartTileType,
} from '../../lib/services/start.service';
import { createSpyObj } from '../mocks';

@Component({
    selector: 'fhg-test-card',
    template: '<div></div>',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestCardComponent {}

describe('StartService', () => {
    let service: StartService;
    let auth: jest.Mocked<AuthService>;

    beforeEach(() => {
        auth = createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { ready: of(true) });
        auth.getCookie.mockReturnValue(of(undefined));
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: START_TILE_TYPES,
                    useValue: [
                        {
                            component: TestCardComponent,
                            name: 'TestCard',
                        } satisfies StartTileType,
                    ],
                },
                {
                    provide: START_TILES,
                    useValue: [{ id: 'test', type: 'TestCard', inputs: {} } satisfies StartTile],
                },
                {
                    provide: AuthService,
                    useValue: auth,
                },
                provideZonelessChangeDetection(),
            ],
        });
        
        service = TestBed.inject(StartService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('has a tiles property', () => {
        expect(service.tiles()).toBeTruthy();
    });

    describe('getType', () => {
        it('should return the type for a given name', () => {
            const type = service.getType('TestCard');
            expect(type).toBeTruthy();
            expect(type!.component).toBe(TestCardComponent);
        });

        it('should return undefined for an unknown name', () => {
            const type = service.getType('UnknownCard');
            expect(type).toBeUndefined();
        });
    });

    describe('add', () => {
        it('should add a new tile', () => {
            expect(service.add('TestCard', 'newTestCard', {})).toBe(true);
            expect(service.tiles().length).toBe(2);
        });

        it('should not add a tile with an unknown type', () => {
            expect(service.add('UnknownCard', 'new', {})).toBe(false);
            expect(service.tiles().length).toBe(1);
        });

        it('should not add a tile with an existing id', () => {
            expect(service.add('TestCard', 'test', {})).toBe(false);
            expect(service.tiles().length).toBe(1);
        });
    });

    describe('remove', () => {
        it('should remove a tile', () => {
            const tile = service.tiles().find(item => item.id === 'test');
            expect(tile).toBeTruthy();
            service.remove(tile!);
            expect(service.tiles().length).toBe(0);
        });

        it('should not remove a tile with an unknown id', () => {
            service.remove({ id: 'unknown', type: 'TestCard', inputs: {} });
            expect(service.tiles().length).toBe(1);
        });
    });

    describe('save', () => {
        it('should save the tiles', done => {
            auth.setCookie.mockReturnValue(of(void 0));
            service.add('TestCard', 'new', {});
            service.save().subscribe(() => {
                expect(auth.setCookie).toHaveBeenCalled();
                done();
            });
        });
    });
});
