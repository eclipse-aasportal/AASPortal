/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, input, untracked } from '@angular/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective } from '@ngx-translate/core';

import { AASDocument } from 'aas-core';

import { NameplateState } from './nameplate.state';
import { ChildComponent } from '../../components/child-component';

/**
 * Provides a component for submodels that belong to the IDTA specification "Digital Nameplate for industrial equipment".
 * Version 2.0 and 3.0 are supported.
 */
@Component({
    selector: 'fhg-nameplate',
    imports: [NgbAccordionModule, TranslateDirective],
    templateUrl: './nameplate.html',
    styleUrl: './nameplate.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nameplate extends ChildComponent implements AfterViewInit {
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

    public ngAfterViewInit(): void {
        this.dataSheets();
    }

    /** The state management service. */
    public state = input.required<NameplateState>();

    /** The active AAS document. */
    public readonly document = input<AASDocument>();

    /** The presentation of the nameplate. */
    public readonly dataSheets = computed(() => this.state().dataSheets());

    public getAssetId(): string | undefined {
        if (!this.document()) return '';

        return this.document()?.assetId;
    }

    public getAASIdShort(): string | undefined {
        if (!this.document()) return '';

        return this.document()?.idShort;
    }

    public checkNameplateValue(name: string | string[]): boolean | string {
        if (!this.dataSheets()) return false;
        if (!this.dataSheets()[0]) return false;
        const value = this.getNameplateValue(name);
        if (value == '-1') return false;
        return true;
    }

    public getNameplateValue(names: string | string[]): string | string[] | undefined {
        if (!this.dataSheets()) return '-1';
        if (!this.dataSheets()[0]) return '-1';

        if (Array.isArray(names)) {
            for (const name of names) {
                const value = this.dataSheets()[0].items.find(
                    element => element.idShort.toLowerCase() == name.toLowerCase(),
                );
                if (value) return value.value;
            }
        } else {
            const value = this.dataSheets()[0].items.find(
                element => element.idShort.toLowerCase() == names.toLowerCase(),
            );
            if (value) return value.value;
        }

        return '-1';
    }

    public getCompanyLogo(): string | undefined {
        if (!this.dataSheets()) return '';
        if (!this.dataSheets()[0]) return '';

        const value = this.dataSheets()[0].items.find(element => element.idShort.toLowerCase() == 'companylogo');
        if (value) return value.url;
        return undefined;
    }
}
