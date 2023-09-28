/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { AASTreeSearch } from '../../lib/aas-tree/aas-tree-search';
import { AASTreeFeatureState } from '../../lib/aas-tree/aas-tree.state';
import { aasTreeReducer } from '../../lib/aas-tree/aas-tree.reducer';
import * as AASTreeActions from '../../lib/aas-tree/aas-tree.actions';
import { sampleDocument } from '../assets/sample-document';

describe('AASTreeSearch', function () {
    let store: Store<AASTreeFeatureState>;
    let search: AASTreeSearch;

    beforeEach(async function () {
        await TestBed.configureTestingModule(
            {
                declarations: [],
                providers: [],
                imports: [
                    StoreModule.forRoot(
                        {
                            tree: aasTreeReducer
                        }),
                    TranslateModule.forRoot({
                        loader: {
                            provide: TranslateLoader,
                            useClass: TranslateFakeLoader
                        }
                    })
                ]
            }
        );

        store = TestBed.inject(Store);
        search = new AASTreeSearch(store, TestBed.inject(TranslateService));

        store.dispatch(AASTreeActions.updateRows({document: sampleDocument, localeId: 'en-us'}));
    });

    afterEach(function () {
        search.destroy();
    });

    it('should create', () => {
        expect(search).toBeTruthy();
    });
});