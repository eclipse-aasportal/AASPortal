import { DependencyContainer } from 'tsyringe';
import { AASCache } from './aas-cache.js';

export class AASCacheFactory {
    constructor(
        private readonly container: DependencyContainer
    ) { }

    public create(): AASCache {
        throw new Error('Not implemented');
    }
}