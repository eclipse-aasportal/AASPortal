/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StartComponent } from '../../app/start/start.component';
import { StartService, ToolbarService } from 'aas-lib';
import { signal } from '@angular/core';

describe('StartComponent', () => {
    let component: StartComponent;
    let fixture: ComponentFixture<StartComponent>;
    let start: jasmine.SpyObj<StartService>;

    beforeEach(async () => {
        start = jasmine.createSpyObj<StartService>(['add', 'getType', 'remove', 'save'], {
            tiles: signal([]).asReadonly(),
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['clear', 'set'], { toolbarTemplate: signal(null) }),
                },
            ],
            imports: [],
        }).compileComponents();

        fixture = TestBed.createComponent(StartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
