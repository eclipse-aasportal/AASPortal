/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { singleton } from 'tsyringe';
import { ScanResultType, ScanStatistic } from './aas-provider/scan-result.js';

@singleton()
export class UpdateStatistic {
    public update(statistic: ScanStatistic, type: ScanResultType): ScanStatistic {
        switch (type) {
            case ScanResultType.Changed:
                ++statistic.changed;
                break;
            case ScanResultType.Added:
                if (statistic.counter > 0) {
                    ++statistic.new;
                }
                break;
            case ScanResultType.Removed:
                ++statistic.deleted;
                break;
            case ScanResultType.End:
                ++statistic.counter;
                break;
        }

        statistic.end = Date.now();

        return statistic;
    }
}