import { AASCursor, AASDocument } from 'common';

export abstract class AASIndex {
    public abstract getDocuments(url: string): Promise<AASDocument[]>;

    public abstract getPage(cursor: AASCursor): Promise<AASDocument[]>;

    public abstract set(document: AASDocument): Promise<void>;

    public abstract add(document: AASDocument): Promise<void>;

    public abstract has(url: string, id?: string): Promise<boolean>;

    public abstract get(url: string, id?: string): Promise<AASDocument>;

    public abstract delete(url?: string, id?: string): Promise<void>;
}