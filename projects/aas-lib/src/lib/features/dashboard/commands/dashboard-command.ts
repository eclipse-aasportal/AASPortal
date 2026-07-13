/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Command } from '../../../services/command';
import { DashboardService } from '../dashboard.service';

export abstract class DashboardCommand extends Command {
    private preState!: string;
    private postState!: string;

    protected constructor(
        name: string,
        protected readonly service: DashboardService,
    ) {
        super(name);
    }

    protected onExecute(): void {
        this.preState = this.service.getMemento();
        this.executing();
        this.postState = this.service.getMemento();
    }

    protected abstract executing(): void;

    protected onUndo(): void {
        this.service.setMemento(this.preState);
    }

    protected onRedo(): void {
        this.service.setMemento(this.postState);
    }

    protected onAbort(): void {
        this.service.setMemento(this.preState);
    }
}
