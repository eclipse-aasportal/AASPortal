/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScoreComponent } from '../../lib/score/score.component';


describe('ScoreComponent', () => {
    let component: ScoreComponent;
    let fixture: ComponentFixture<ScoreComponent>;
    let positiveDiv: HTMLDivElement;
    let negativeDiv: HTMLDivElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ScoreComponent]
        });

        fixture = TestBed.createComponent(ScoreComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        const element: HTMLElement = fixture.debugElement.nativeElement;
        positiveDiv = element.querySelector('.score-pos')!;
        negativeDiv = element.querySelector('.score-neg')!;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(positiveDiv).toBeTruthy();
        expect(negativeDiv).toBeTruthy();
    });

    it('it shows a positive score', function () {
        component.score = 0.42;
        component.ngOnChanges({ score: new SimpleChange(0, component.score, true) });
        fixture.detectChanges();

        expect(component.positive).toEqual(42);
        expect(component.negative).toEqual(0);

        expect(positiveDiv.style.width).toEqual('42%');
        expect(negativeDiv.style.width).toEqual('0%');
    });
    
    it('it shows a negative score', function () {
        component.score = -0.42;
        component.ngOnChanges({ score: new SimpleChange(0, component.score, true) });
        fixture.detectChanges();

        expect(component.negative).toEqual(42);
        expect(component.positive).toEqual(0);
        expect(positiveDiv.style.width).toEqual('0%');
        expect(negativeDiv.style.width).toEqual('42%');
    });

    it('it shows an undefined score', function () {
        component.score = 0.0;
        component.ngOnChanges({ score: new SimpleChange(0, component.score, true) });
        fixture.detectChanges();

        expect(component.negative).toEqual(0);
        expect(component.positive).toEqual(0);
        expect(positiveDiv.style.width).toEqual('0%');
        expect(negativeDiv.style.width).toEqual('0%');
    });

    it('it limits the positive score to 100%', function () {
        component.score = 1234567.89;
        component.ngOnChanges({ score: new SimpleChange(0, component.score, true) });
        fixture.detectChanges();

        expect(component.positive).toEqual(100);
        expect(component.negative).toEqual(0);
    });
    
    it('it shows a negative score', function () {
        component.score = -1234567.89;
        component.ngOnChanges({ score: new SimpleChange(0, component.score, true) });
        fixture.detectChanges();

        expect(component.negative).toEqual(100);
        expect(component.positive).toEqual(0);
    });
});