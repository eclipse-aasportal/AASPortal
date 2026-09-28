/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, input } from '@angular/core';
import { TranslateDirective } from '@ngx-translate/core';

/**
 * A centered Bootstrap spinner shown in place of a view's content while its document/submodel is
 * still being fetched -- shared so every "Leaf"/"Composite" view shows the same feedback instead
 * of either blank content or a misleading "empty" message while the request is still in flight.
 */
@Component({
    selector: 'fhg-loading-spinner',
    templateUrl: './loading-spinner.html',
    imports: [TranslateDirective],
})
export class LoadingSpinner {
    /** Translation key shown next to the spinner. */
    public readonly caption = input<string>('Main.LOADING');
}
