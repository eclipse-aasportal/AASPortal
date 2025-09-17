/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { StartService, ToolbarService } from 'aas-lib';
import { StartComponent } from '../../app/start/start.component';
import { createSpyObj, FakeLoader } from '../mocks';
import { StartState, StartTileItem } from '../../app/start/start.state';

describe('StartComponent', () => {
    let start: jest.Mocked<StartService>;
    let sanitizer: jest.Mocked<DomSanitizer>;
    let state: Partial<StartState>;
    let favorites: StartTileItem[];
    let fixture: ComponentFixture<StartComponent>;
    let component: StartComponent;
    let items: WritableSignal<StartTileItem[]>;

    beforeEach(async () => {
        start = createSpyObj<StartService>(['add', 'getType', 'remove', 'save'], {
            tiles: signal([]),
        });

        sanitizer = createSpyObj<DomSanitizer>(['bypassSecurityTrustHtml']);
        sanitizer.bypassSecurityTrustHtml.mockImplementation(value => value as SafeHtml);
        favorites = [
            { id: '1', selected: signal(false) },
            { id: '2', selected: signal(false) },
            { id: '3', selected: signal(false) },
        ] as StartTileItem[];

        items = signal(favorites);
        state = { welcome: signal('Welcome'), items };

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['clear', 'set'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: DomSanitizer,
                    useValue: sanitizer,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [StartComponent],
        }).compileComponents();

        TestBed.overrideComponent(StartComponent, {
            remove: {
                providers: [StartState],
            },
            add: {
                providers: [{ provide: StartState, useValue: state }],
            },
        });

        fixture = TestBed.createComponent(StartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('has a toolbar', () => {
        expect(component.toolbarTemplate).toBeTruthy();
    });

    describe('no selection', () => {
        it('has nothing selected', () => {
            expect(component.someSelected()).toBe(false);
        });

        it('disables can move left', () => {
            expect(component.canMoveLeft()).toBe(false);
        });

        it('disables can move right', () => {
            expect(component.canMoveRight()).toBe(false);
        });
    });

    describe('first favorite selection', () => {
        beforeEach(() => {
            favorites[0].selected.set(true);
        });

        it('has some selected', () => {
            expect(component.someSelected()).toBe(true);
        });

        it('disables can move left', () => {
            expect(component.canMoveLeft()).toBe(false);
        });

        it('disables can move right', () => {
            expect(component.canMoveRight()).toBe(true);
        });
    });

    describe('last favorite selection', () => {
        beforeEach(() => {
            favorites[2].selected.set(true);
        });

        it('has some selected', () => {
            expect(component.someSelected()).toBe(true);
        });

        it('disables can move left', () => {
            expect(component.canMoveLeft()).toBe(true);
        });

        it('disables can move right', () => {
            expect(component.canMoveRight()).toBe(false);
        });
    });

    describe('multiple selection', () => {
        beforeEach(() => {
            favorites[0].selected.set(true);
            favorites[1].selected.set(true);
        });

        it('has some selected', () => {
            expect(component.someSelected()).toBe(true);
        });

        it('disables can move left', () => {
            expect(component.canMoveLeft()).toBe(false);
        });

        it('disables can move right', () => {
            expect(component.canMoveRight()).toBe(false);
        });
    });

    it('shows favorites', () => {
        expect(component.isEmpty()).toBe(false);
        expect(component.items()).toEqual(favorites);
    });

    it('shows a welcome page', () => {
        items.set([]);
        expect(component.isEmpty()).toBe(true);
        expect(component.welcome()).toEqual('Welcome');
    });

    // describe('remove', () => {
    //     it('removes the selected favorite', () => {
    //         const fixture = TestBed.createComponent(StartComponent);
    //         favorites[1].selected.set(true);
    //         fixture.detectChanges();
    //         const removeButton: HTMLButtonElement = fixture.debugElement.query(By.css('#AID_REMOVE')).nativeElement;
    //         removeButton.click();
    //         expect(removeButton.disabled).toBeFalsy();
    //         expect(start.remove).toHaveBeenCalled();
    //     });
    // });

    // describe('moveLeft', () => {});

    // describe('moveLeft', () => {});
});
