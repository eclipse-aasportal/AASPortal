/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/**
 * @description
 * Provides support for lazy initialization.
 * @template T The type of the object that is being lazily initialized.
 */
export class Lazy<T> {
    private initialize: () => Promise<T>;
    private _value?: T;

    /**
     *
     * @param initialize The
     */
    public constructor(initialize: () => Promise<T>) {
        this.initialize = initialize;
    }

    /**
     * Indicates whether a value has been created.
     * @returns {boolean} `true` if the value is created; otherwise, `false`.
     */
    public get hasValue(): boolean {
        return this._value !== undefined;
    }

    /**
     * Gets the lazily initialized value.
     * @returns T
     */
    public async getValueAsync(): Promise<T> {
        if (!this._value) {
            this._value = await this.initialize();
        }

        return this._value;
    }
}
