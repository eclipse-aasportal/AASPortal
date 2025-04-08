/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, effect, OnDestroy, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first, from, mergeMap, of, toArray } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { aas, AASDocument } from 'aas-core';
import { decodeBase64Url } from '../../utilities';
import { DocumentsService } from '../../services/documents.service';
import { ToolbarService } from '../../services/toolbar.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

export type BrowserCategoryItem = {};

export type BrowserCategory = {
    name: string;
    items: BrowserCategoryItem[];
};

const map = new Map<string, string>([
    ['id', 'Identifiable'],
    ['administration', 'Identifiable'],
    ['category', 'Referable'],
    ['description', 'Referable'],
    ['displayName', 'Referable'],
    ['idShort', 'Referable'],
    ['modelType', 'Referable'],
    ['extensions', 'HasExtension'],
    ['semanticId', 'HasSemantics'],
    ['supplementalSemanticIds', 'HasSemantics'],
    ['embeddedDataSpecifications', 'HasDataSpecification'],
    ['qualifiers', 'Qualifiable'],
    ['kind', 'HasKind'],
    ['value', 'SubmodelElement'],
    ['valueId', 'SubmodelElement'],
    ['first', 'SubmodelElement'],
    ['second', 'SubmodelElement'],
    ['max', 'SubmodelElement'],
    ['min', 'SubmodelElement'],
    ['valueType', 'SubmodelElement'],
    ['orderRelevant', 'SubmodelElement'],
    ['semanticIdListElement', 'SubmodelElement'],
    ['typeValueListElement', 'SubmodelElement'],
    ['valueTypeListElement', 'SubmodelElement'],
    ['submodelElements', 'Submodel'],
    ['inoutputVariables', 'SubmodelElement'],
    ['inputVariables', 'SubmodelElement'],
    ['outputVariables', 'SubmodelElement'],
    ['contentType', 'SubmodelElement'],
    ['entityType', 'SubmodelElement'],
    ['globalAssetId', 'SubmodelElement'],
    ['specificAssetIds', 'SubmodelElement'],
    ['statements', 'SubmodelElement'],
    ['isCaseOf', 'SubmodelElement'],
    ['direction', 'SubmodelElement'],
    ['lastUpdate', 'SubmodelElement'],
    ['maxInterval', 'SubmodelElement'],
    ['messageBroker', 'SubmodelElement'],
    ['messageTopic', 'SubmodelElement'],
    ['minInterval', 'SubmodelElement'],
    ['observed', 'SubmodelElement'],
    ['state', 'SubmodelElement'],
]);

@Component({
    selector: 'fhg-browser',
    templateUrl: './browser.component.html',
    styleUrl: './browser.component.scss',
    imports: [TranslateModule, NgbPaginationModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowserComponent implements OnInit, OnDestroy {
    private readonly documents = signal<AASDocument[]>([]);

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly api: DocumentsService,
        private readonly toolbar: ToolbarService,
    ) {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('browserToolbar');

    public readonly isEmpty = computed(() => this.documents().length === 0);

    public readonly documentSize = computed(() => this.documents().length);

    public readonly document = computed(() => this.documents().at(this.documentIndex() - 1));

    public readonly documentIndex = signal(1);

    public readonly path = signal<aas.Referable[]>([]);

    public readonly current = signal<aas.Referable | undefined>(undefined);

    public readonly categories = computed(() => {
        const document = this.document();
        if (document === undefined) {
            return [] as BrowserCategory[];
        }

        return [] as BrowserCategory[];
    });


    public ngOnInit(): void {
        this.route.queryParams
            .pipe(
                first(),
                mergeMap(params => {
                    if (params.id) {
                        const endpoint = params.endpoint ? decodeBase64Url(params.endpoint) : undefined;
                        return this.api.getDocument(decodeBase64Url(params.id), endpoint).pipe(toArray());
                    }

                    if (!params.docs) {
                        return of([]);
                    }

                    const docs: [string, string][] = JSON.parse(decodeBase64Url(params.docs));
                    return from(docs).pipe(
                        mergeMap(([endpoint, id]) => this.api.getDocument(id, endpoint)),
                        toArray(),
                    );
                }),
            )
            .subscribe(documents => {
                this.initialize(documents);
            });
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public goUp(referable: aas.Referable): void {
        const index = this.path().indexOf(referable);
        this.path.update(state => state.slice(0, index));
        this.current.set(referable);
    }

    private initialize(documents: AASDocument[]) {
        this.documents.set(documents);
    }
}
