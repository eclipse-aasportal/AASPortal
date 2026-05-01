/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ChangeDetectionStrategy, Component, computed, effect, Input, input, untracked } from '@angular/core';
import { TranslateDirective } from '@ngx-translate/core';

import { AASDocument } from 'aas-core';

import { CarbonFootprintState } from './carbon-footprint.state';
import { ChildComponent } from '../../components/child-component';

/**
 * Provides a component for a submodel that belongs to the IDTA specification "Carbon Footprint".
 * Version 0.9 and 1.0 are supported.
 */
@Component({
    selector: 'fhg-carbon-footprint',
    templateUrl: './carbon-footprint.html',
    styleUrl: './carbon-footprint.scss',
    providers: [CarbonFootprintState],
    imports: [NgbAccordionModule, NgbPaginationModule, TranslateDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarbonFootprint extends ChildComponent {
    // Determines wether the view is used from inside the dpp view or standalone
    @Input() public isDigitalProductPassport: boolean = false;

    public showDetails: boolean = this.isDigitalProductPassport;

    public constructor() {
        super();

        effect(() => {
            const document = this.document();
            if (!document) {
                return;
            }

            const value = untracked(this.state().document);
            if (value === null || document.endpoint !== value.endpoint || document.id !== value.id) {
                this.state().update({ document });
            }
        });
    }

    /**
     * The AAS document.
     */
    public readonly document = input<AASDocument>();

    /**
     * A flag indicating whether the component is collapsed.
     */
    public readonly collapsed = input(false);

    /**
     * The state of the carbon footprint component.
     */
    public readonly state = input.required<CarbonFootprintState>();

    /**
     * The total product carbon footprint.
     */
    public readonly totalPcfCO2eq = computed(() => this.state().totalPcfCO2eq());

    /**
     * The available product carbon footprint items.
     */
    public readonly items = computed(() => this.state().items());

    /**
     * The current active carbon footprint item.
     */
    public readonly item = computed(() => {
        return this.state().items()[this.state().index() - 1];
    });

    /**
     * The index of the current active carbon footprint item.
     */
    public readonly index = computed(() => this.state().index());

    /**
     * The number of carbon footprint items.
     */
    public readonly count = computed(() => this.state().items().length);

    /**
     * Activates the carbon footprint with the specified index.
     * @param index The index of the carbon footprint to activate.
     */
    public setIndex(index: number): void {
        this.state().update({ index });
    }

    public getTotalPCFValue(): string | string[] {
        const result = this.totalPcfCO2eq();
        const splitResult = result.split(' ');
        if (!splitResult || splitResult.length <= 0) return '';
        return splitResult[0];
    }

    public getTotalPCFUnit(): string | string[] {
        const result = this.totalPcfCO2eq();
        const splitResult = result.split(' ');
        if (!splitResult || splitResult.length <= 1) return '';
        return splitResult[1];
    }

    public getValueFromDataSheet(name: string): string | string[] | undefined {
        const datasheet = this.item();
        const result = datasheet.items.find(element => element.idShort === name);
        if (!result) return '-1';
        return result.value;
    }

    public getFilenameExplanation(): string | string[] | undefined {
        const datasheet = this.item();
        const result = datasheet.items.find(element => element.idShort === 'ExplanatoryStatement');
        if (!result || !result.value) return '';
        return result.value;
    }

    public openFile(): void {
        const datasheet = this.item();
        const result = datasheet.items.find(element => element.idShort === 'ExplanatoryStatement');
        if (!result || !result.url) return;

        window.open(result.url, '_blank');
    }

    public toggleDetailView(): void {
        this.showDetails = !this.showDetails;
    }
}
