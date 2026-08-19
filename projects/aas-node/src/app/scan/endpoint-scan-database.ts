/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseSync, StatementSync } from 'node:sqlite';
import { aas } from 'aas-core';

const initScanDatabase = `
CREATE TABLE IF NOT EXISTS shells (
    id TEXT PRIMARY KEY,
    changed INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS submodels (
    submodelId TEXT NOT NULL,
    shellId TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submodels_submodelId ON submodels (submodelId);

CREATE TABLE IF NOT EXISTS conceptDescriptions (
    id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conceptDescriptions_id ON conceptDescriptions (id);
`;

export class EndpointScanDatabase {
    private readonly db: DatabaseSync;
    private readonly deleteShellsSql: StatementSync;
    private readonly deleteSubmodelsSql: StatementSync;
    private readonly deleteConceptDescriptionsSql: StatementSync;
    private readonly insertSubmodelSql: StatementSync;
    private readonly insertConceptDescriptionSql: StatementSync;
    private readonly upsertShellSql: StatementSync;
    private readonly selectShellSql: StatementSync;
    private readonly selectSubmodelShellsSql: StatementSync;
    private readonly selectConceptDescriptionSql: StatementSync;

    public constructor(file?: string) {
        this.db = new DatabaseSync(file ?? ':memory:', { timeout: 5000 });
        this.db.exec(initScanDatabase);
        this.deleteShellsSql = this.db.prepare('DELETE FROM shells');
        this.deleteSubmodelsSql = this.db.prepare('DELETE FROM submodels');
        this.deleteConceptDescriptionsSql = this.db.prepare('DELETE FROM conceptDescriptions');
        this.insertSubmodelSql = this.db.prepare('INSERT INTO submodels (submodelId, shellId) VALUES (?, ?)');
        this.insertConceptDescriptionSql = this.db.prepare('INSERT INTO conceptDescriptions (id) VALUES (?)');
        this.upsertShellSql = this.db.prepare(
            'INSERT INTO shells (id, changed) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET changed = excluded.changed',
        );

        this.selectShellSql = this.db.prepare('SELECT changed FROM shells WHERE id = ?');
        this.selectSubmodelShellsSql = this.db.prepare('SELECT shellId FROM submodels WHERE submodelId = ?');
        this.selectConceptDescriptionSql = this.db.prepare('SELECT id FROM conceptDescriptions WHERE id = ?');
    }

    public clear(): void {
        this.db.exec('BEGIN');
        try {
            this.deleteShellsSql.run();
            this.deleteSubmodelsSql.run();
            this.deleteConceptDescriptionsSql.run();
            this.db.exec('COMMIT');
        } catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
    }

    public close(): void {
        if (this.db.isOpen) {
            this.db.close();
        }
    }

    public registerSubmodels(submodelRefs: aas.Reference[], shellId: string): void {
        for (const submodelRef of submodelRefs) {
            const submodelId = submodelRef.keys.at(0)?.value;
            if (submodelId) {
                this.insertSubmodelSql.run(submodelId, shellId);
            }
        }
    }

    public registerConceptDescription(conceptDescription: aas.ConceptDescription): void {
        this.insertConceptDescriptionSql.run(conceptDescription.id);
    }

    public setShellChanged(shellId: string, changed: boolean): void {
        this.upsertShellSql.run(shellId, changed ? 1 : 0);
    }

    public hasShell(shellId: string): boolean {
        return this.selectShellSql.get(shellId) !== undefined;
    }

    public isShellChanged(shellId: string): boolean {
        const value = this.selectShellSql.get(shellId);
        return value !== undefined && Number(value.changed) !== 0;
    }

    public getSubmodelShellIds(submodelId: string): string[] {
        return this.selectSubmodelShellsSql.all(submodelId).map(value => String(value.shellId));
    }

    public hasConceptDescription(conceptDescriptionId: string): boolean {
        return this.selectConceptDescriptionSql.get(conceptDescriptionId) !== undefined;
    }
}
