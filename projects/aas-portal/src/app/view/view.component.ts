/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToolbarService, VIEW_ROUTES } from 'aas-lib';
import { ViewState } from './view.state';

/**
 * The View page. Provides a container for a specific view of a submodel or an Asset Administration Shell with
 * a composition of specific submodels.
 */
@Component({
    selector: 'fhg-view',
    templateUrl: './view.component.html',
    styleUrls: ['./view.component.scss'],
    imports: [RouterOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewComponent implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly state = inject(ViewState);
    private readonly viewRoutes = inject(VIEW_ROUTES);

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    protected setViewComponent(component: object): void {
        const className = component.constructor.name;
        const activeView = this.viewRoutes.find(item => item.component?.name === className);
        this.state.update({ activeView });
    }
}
