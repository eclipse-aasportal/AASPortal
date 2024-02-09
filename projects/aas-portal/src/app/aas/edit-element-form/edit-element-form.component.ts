/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { convertBlobToBase64Async, extension } from 'aas-lib';
import { aas, extensionToMimeType, toInvariant, toLocale } from 'common';

export interface LangStringRow extends aas.LangString {
    index: number;
    selected: boolean;
}

@Component({
    selector: 'fhg-edit-element',
    templateUrl: './edit-element-form.component.html',
    styleUrls: ['./edit-element-form.component.scss'],
})
export class EditElementFormComponent {
    private element?: aas.Referable;

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
    ) {}

    public modelType!: aas.ModelType;

    public idShort = '';

    public semanticId = '';

    public categories: string[] = ['-', 'CONSTANT', 'PARAMETER', 'VARIABLE'];

    public category = '-';

    public valueType: aas.DataTypeDefXsd | null = null;

    public valueTypes: aas.DataTypeDefXsd[] = [
        'xs:anyURI',
        'xs:base64Binary',
        'xs:boolean',
        'xs:byte',
        'xs:date',
        'xs:dateTime',
        'xs:decimal',
        'xs:double',
        'xs:duration',
        'xs:float',
        'xs:gDay',
        'xs:gMonth',
        'xs:gMonthDay',
        'xs:gYear',
        'xs:gYearMonth',
        'xs:hexBinary',
        'xs:int',
        'xs:integer',
        'xs:long',
        'xs:negativeInteger',
        'xs:nonNegativeInteger',
        'xs:nonPositiveInteger',
        'xs:positiveInteger',
        'xs:short',
        'xs:string',
        'xs:time',
        'xs:unsignedByte',
        'xs:unsignedInt',
        'xs:unsignedLong',
        'xs:unsignedShort',
    ];

    public value?: string;

    public min?: string;

    public max?: string;

    public langStrings: LangStringRow[] = [];

    public contentType?: string;

    public files?: string[];

    public messages: string[] = [];

    public initialize(element: aas.SubmodelElement) {
        this.element = { ...element };
        this.modelType = element.modelType;
        this.semanticId = this.referenceToString(element.semanticId);
        this.category = element.category ?? '-';
        this.idShort = element.idShort;

        switch (this.modelType) {
            case 'Property':
                this.initProperty();
                break;
            case 'MultiLanguageProperty':
                this.initMultiLanguageProperty();
                break;
            case 'Range':
                this.initRange();
                break;
            case 'Blob':
                this.initBlob();
                break;
        }
    }

    public submit() {
        if (this.element && this.submitElement()) {
            this.modal.close(this.element);
        }
    }

    public cancel() {
        this.modal.close();
    }

    public select(item: LangStringRow): void {
        this.langStrings.forEach(langString => {
            if (item === langString && langString.index >= 0) {
                langString.selected = !langString.selected;
            } else {
                langString.selected = false;
            }
        });
    }

    public addLangString(): void {
        this.clearMessages();
        const last = this.langStrings[this.langStrings.length - 1];
        last.index = this.langStrings.length - 1;
        this.langStrings.forEach(item => (item.selected = false));
        last.selected = true;
        this.langStrings.push({ language: '', text: '', selected: false, index: -1 });
    }

    public removeLangString(item: LangStringRow) {
        this.clearMessages();
        if (item.index >= 0) {
            this.langStrings = this.langStrings.filter(langString => langString !== item);
            this.langStrings.forEach((langString, index) => (langString.index = index));
            this.langStrings[this.langStrings.length - 1].index = -1;
        }
    }

    public setLanguage(langString: LangStringRow, value: string): void {
        try {
            langString.language = Intl.getCanonicalLocales(value)[0];
        } catch (err) {
            this.pushMessage(`${value} is an invalid locale ID.`);
        }
    }

    public setText(langString: LangStringRow, value: string): void {
        langString.text = value;
    }

    public readFile(files: FileList | null): void {
        if (files && files.length === 1) {
            const ext = extension(files[0].name);
            if (ext) {
                const temp = this.value;
                this.value = undefined;
                this.contentType = extensionToMimeType(ext);
                convertBlobToBase64Async(files[0])
                    .then(value => (this.value = value))
                    .catch(() => {
                        this.value = temp;
                        this.pushMessage('Unable to read file.');
                    });
            }
        }
    }

    private initProperty(): void {
        const property = this.element as aas.Property;
        this.value = toLocale(property.value, property.valueType, this.translate.currentLang);
        this.valueType = property.valueType ?? null;
    }

    private initMultiLanguageProperty(): void {
        const multiLangProperty = this.element as aas.MultiLanguageProperty;
        this.langStrings = multiLangProperty.value.map(
            (item, index) => ({ ...item, selected: false, index }) as LangStringRow,
        );

        this.langStrings.push({ language: '', text: '', selected: false, index: -1 });
    }

    private initRange(): void {
        const range = this.element as aas.Range;
        this.min = toLocale(range.min, range.valueType, this.translate.currentLang);
        this.max = toLocale(range.max, range.valueType, this.translate.currentLang);
        this.valueType = range.valueType ?? null;
    }

    private initBlob(): void {
        const blob = this.element as aas.Blob;
        this.contentType = blob.contentType;
        this.value = blob.value;
    }

    private submitElement(): boolean {
        if (this.category !== '-') {
            this.element!.category = this.category;
        } else {
            delete this.element!.category;
        }

        switch (this.modelType) {
            case 'Property':
                return this.submitProperty();
            case 'MultiLanguageProperty':
                return this.submitMultiLanguageProperty();
            case 'Range':
                return this.submitRange();
            case 'Blob':
                return this.submitBlob();
            default:
                return false;
        }
    }

    private submitProperty(): boolean {
        if (this.valueType && this.element) {
            const property = this.element as aas.Property;
            property.valueType = this.valueType;

            if (this.value) {
                const value = toInvariant(this.value, this.valueType, this.translate.currentLang);
                if (value) {
                    property.value = value;
                    return true;
                } else {
                    this.pushMessage(`"${this.value}"cannot be converted to type "${this.valueType}".`);
                }
            } else {
                return true;
            }
        }

        return false;
    }

    private submitMultiLanguageProperty(): boolean {
        if (this.element) {
            const multiLangProperty = this.element as aas.MultiLanguageProperty;
            multiLangProperty.value = this.langStrings
                .filter(item => item.language && item.text && item.index >= 0)
                .map(item => ({ language: item.language, text: item.text }));

            return true;
        }

        return false;
    }

    private submitRange(): boolean {
        if (this.valueType && this.element) {
            const range = this.element as aas.Range;
            range.valueType = this.valueType;

            if (this.min && this.max) {
                const min = toInvariant(this.min, this.valueType, this.translate.currentLang);
                const max = toInvariant(this.max, this.valueType, this.translate.currentLang);
                if (min && max) {
                    range.min = min;
                    range.max = max;
                    return true;
                } else {
                    this.pushMessage(`"${this.min}...${this.max}"cannot be converted to type "${this.valueType}".`);
                }
            } else {
                return true;
            }
        }

        return false;
    }

    private submitBlob(): boolean {
        if (this.value && this.element && this.contentType) {
            const blob = this.element as aas.Blob;
            blob.contentType = this.contentType;
            blob.value = this.value;
            return true;
        }

        return false;
    }

    private referenceToString(reference?: aas.Reference): string {
        return reference ? reference.keys.map(key => key.value).join('/') : '-';
    }

    private pushMessage(message: string): void {
        this.messages = [message];
    }

    private clearMessages() {
        this.messages = [];
    }
}