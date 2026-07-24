/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export class ScannerController {
    private cancelResolve?: () => void;

    public get cancelRequested(): boolean {
        return this.cancelResolve !== undefined;
    }

    public cancel(): Promise<void> {
        return new Promise<void>(resolve => {
            this.cancelResolve = resolve;
        });
    }

    public end(): void {
        this.cancelResolve?.();
        this.cancelResolve = undefined;
    }
}
