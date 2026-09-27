/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScoreComponent } from './score.component';

describe('ScoreComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
            imports: [ScoreComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ScoreComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const element: HTMLElement = fixture.debugElement.nativeElement;
        const positiveDiv: HTMLDivElement = element.querySelector('.score-pos')!;
        const negativeDiv: HTMLDivElement = element.querySelector('.score-neg')!;
        expect(component).toBeTruthy();
        expect(positiveDiv).toBeTruthy();
        expect(negativeDiv).toBeTruthy();
    });

    it('it shows a positive score', () => {
        const fixture = TestBed.createComponent(ScoreComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const element: HTMLElement = fixture.debugElement.nativeElement;
        const positiveDiv: HTMLDivElement = element.querySelector('.score-pos')!;
        const negativeDiv: HTMLDivElement = element.querySelector('.score-neg')!;
        fixture.componentRef.setInput('score', 0.42);
        fixture.detectChanges();

        expect(component.positive()).toEqual(42);
        expect(component.negative()).toEqual(0);

        expect(positiveDiv.style.width).toEqual('42%');
        expect(negativeDiv.style.width).toEqual('0%');
    });

    it('it shows a negative score', () => {
        const fixture = TestBed.createComponent(ScoreComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const element: HTMLElement = fixture.debugElement.nativeElement;
        const positiveDiv: HTMLDivElement = element.querySelector('.score-pos')!;
        const negativeDiv: HTMLDivElement = element.querySelector('.score-neg')!;
        fixture.componentRef.setInput('score', -0.42);
        fixture.detectChanges();

        expect(component.negative()).toEqual(42);
        expect(component.positive()).toEqual(0);
        expect(positiveDiv.style.width).toEqual('0%');
        expect(negativeDiv.style.width).toEqual('42%');
    });

    it('it shows an undefined score', () => {
        const fixture = TestBed.createComponent(ScoreComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const element: HTMLElement = fixture.debugElement.nativeElement;
        const positiveDiv: HTMLDivElement = element.querySelector('.score-pos')!;
        const negativeDiv: HTMLDivElement = element.querySelector('.score-neg')!;
        fixture.componentRef.setInput('score', 0.0);
        fixture.detectChanges();

        expect(component.negative()).toEqual(0);
        expect(component.positive()).toEqual(0);
        expect(positiveDiv.style.width).toEqual('0%');
        expect(negativeDiv.style.width).toEqual('0%');
    });

    it('it limits the positive score to 100%', () => {
        const fixture = TestBed.createComponent(ScoreComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        fixture.componentRef.setInput('score', 1234567.89);
        fixture.detectChanges();

        expect(component.positive()).toEqual(100);
        expect(component.negative()).toEqual(0);
    });

    it('it shows a 100% negative score', () => {
        const fixture = TestBed.createComponent(ScoreComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        fixture.componentRef.setInput('score', -1234567.89);
        fixture.detectChanges();

        expect(component.negative()).toEqual(100);
        expect(component.positive()).toEqual(0);
    });
});
