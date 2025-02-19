/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { convertBlobToBase64Async, extension } from 'aas-lib';
import { aas, extensionToMimeType, toInvariant, toLocale } from 'aas-core';

export interface LangStringRow extends aas.LangString {
    index: number;
    selected: boolean;
}

@Component({
    selector: 'fhg-edit-element',
    templateUrl: './edit-element-form.component.html',
    styleUrls: ['./edit-element-form.component.scss'],
    imports: [NgbToast, FormsModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditElementFormComponent {
    private element?: aas.Referable;

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
    ) {}

    public readonly modelType = signal<aas.ModelType | undefined>(undefined);

    public readonly idShort = signal('');

    public readonly semanticId = signal('');

    public readonly categories = signal<string[]>(['-', 'CONSTANT', 'PARAMETER', 'VARIABLE']).asReadonly();

    public readonly category = signal('-');

    public readonly valueType = signal<aas.DataTypeDefXsd | null>(null);

    public readonly valueTypes = signal<aas.DataTypeDefXsd[]>([
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
    ]).asReadonly();

    public readonly value = signal<string | undefined>(undefined);

    public readonly min = signal<string | undefined>(undefined);

    public readonly max = signal<string | undefined>(undefined);

    public readonly langStrings = signal<LangStringRow[]>([]);

    public readonly contentType = signal<string | undefined>(undefined);

    public readonly files = signal<string[]>([]);

    public readonly messages = signal<string[]>([]);

    public initialize(element: aas.SubmodelElement) {
        this.element = { ...element };
        this.modelType.set(element.modelType);
        this.semanticId.set(this.referenceToString(element.semanticId));
        this.category.set(element.category ?? '-');
        this.idShort.set(element.idShort);

        switch (this.modelType()) {
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
        this.langStrings().forEach(langString => {
            if (item === langString && langString.index >= 0) {
                langString.selected = !langString.selected;
            } else {
                langString.selected = false;
            }
        });
    }

    public addLangString(): void {
        this.clearMessages();
        this.langStrings.update(values => {
            const j = values.length - 1;
            values.forEach((value, i) => {
                value.index = i;
                value.selected = i === j;
            });

            return [...values, { language: '', text: '', selected: false, index: -1 }];
        });
    }

    public removeLangString(item: LangStringRow) {
        this.clearMessages();
        if (item.index >= 0) {
            this.langStrings.update(values => {
                const langStrings = values.filter(value => value !== item);
                langStrings.forEach((langString, index) => (langString.index = index));
                langStrings[langStrings.length - 1].index = -1;
                return langStrings;
            });
        }
    }

    public setLanguage(langString: LangStringRow, value: string): void {
        try {
            langString.language = Intl.getCanonicalLocales(value)[0];
        } catch {
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
                const temp = this.value();
                this.value.set(undefined);
                this.contentType.set(extensionToMimeType(ext));
                convertBlobToBase64Async(files[0])
                    .then(value => this.value.set(value))
                    .catch(() => {
                        this.value.set(temp);
                        this.pushMessage('Unable to read file.');
                    });
            }
        }
    }

    private initProperty(): void {
        const property = this.element as aas.Property;
        this.value.set(toLocale(property.value, property.valueType, this.translate.currentLang));
        this.valueType.set(property.valueType ?? null);
    }

    private initMultiLanguageProperty(): void {
        const multiLangProperty = this.element as aas.MultiLanguageProperty;
        this.langStrings.set([
            ...(multiLangProperty.value
                ? multiLangProperty.value.map((item, index) => ({ ...item, selected: false, index }) as LangStringRow)
                : []),
            { language: '', text: '', selected: false, index: -1 },
        ]);
    }

    private initRange(): void {
        const range = this.element as aas.Range;
        this.min.set(toLocale(range.min, range.valueType, this.translate.currentLang));
        this.max.set(toLocale(range.max, range.valueType, this.translate.currentLang));
        this.valueType.set(range.valueType ?? null);
    }

    private initBlob(): void {
        const blob = this.element as aas.Blob;
        this.contentType.set(blob.contentType);
        this.value.set(blob.value);
    }

    private submitElement(): boolean {
        if (this.category() !== '-') {
            this.element!.category = this.category();
        } else {
            delete this.element!.category;
        }

        switch (this.modelType()) {
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
        const valueType = this.valueType();
        if (valueType && this.element) {
            const property = this.element as aas.Property;
            property.valueType = valueType;

            if (this.value()) {
                const value = toInvariant(this.value(), valueType, this.translate.currentLang);
                if (value) {
                    property.value = value;
                    return true;
                } else {
                    this.pushMessage(`"${this.value()}"cannot be converted to type "${valueType}".`);
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
            multiLangProperty.value = this.langStrings()
                .filter(item => item.language && item.text && item.index >= 0)
                .map(item => ({ language: item.language, text: item.text }));

            return true;
        }

        return false;
    }

    private submitRange(): boolean {
        const valueType = this.valueType();
        if (valueType && this.element) {
            const range = this.element as aas.Range;
            range.valueType = valueType;

            if (this.min && this.max) {
                const min = toInvariant(this.min(), valueType, this.translate.currentLang);
                const max = toInvariant(this.max(), valueType, this.translate.currentLang);
                if (min && max) {
                    range.min = min;
                    range.max = max;
                    return true;
                } else {
                    this.pushMessage(`"${this.min()}...${this.max()}"cannot be converted to type "${valueType}".`);
                }
            } else {
                return true;
            }
        }

        return false;
    }

    private submitBlob(): boolean {
        const value = this.value();
        const contentType = this.contentType();
        if (value && this.element && contentType) {
            const blob = this.element as aas.Blob;
            blob.contentType = contentType;
            blob.value = value;
            return true;
        }

        return false;
    }

    private referenceToString(reference?: aas.Reference): string {
        return reference ? reference.keys.map(key => key.value).join('.') : '-';
    }

    private pushMessage(message: string): void {
        this.messages.set([message]);
    }

    private clearMessages() {
        this.messages.set([]);
    }
}
