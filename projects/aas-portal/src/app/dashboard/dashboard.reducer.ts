/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import * as DashboardActions from './dashboard.actions';
import { DashboardPage, DashboardRow, DashboardState } from './dashboard.state';
import { SelectionMode } from '../types/selection-mode';

export function createPageName(pages: DashboardPage[] = []): string {
    let name = '';
    for (let i = 1; i < Number.MAX_SAFE_INTEGER; i++) {
        name = 'Dashboard ' + i;
        if (!pages.find(page => page.name === name)) {
            return name;
        }
    }

    throw new Error('Unable to create unique name.');
}

export const initialState: DashboardState = {
    name: createPageName(),
    pages: [],
    editMode: false,
    selectionMode: SelectionMode.Single,
    rows: [],
};

export const dashboardReducer = createReducer(
    initialState,
    on(DashboardActions.addNewPage, (state, { name }) => addNewPage(state, name)),
    on(DashboardActions.deletePage, (state, { page }) => deletePage(state, page)),
    on(DashboardActions.renamePage, (state, { page, name }) => renamePage(state, page, name)),
    on(DashboardActions.setPageName, (state, { name }) => setPageName(state, name)),
    on(DashboardActions.setPages, (state, { pages }) => setPages(state, pages)),
    on(DashboardActions.setState, (_, { state }) => setState(state)),
    on(DashboardActions.setEditMode, (state, { editMode }) => setEditMode(state, editMode)),
    on(DashboardActions.updatePage, (state, { page, rows }) => updatePage(state, page, rows)),
    on(DashboardActions.updateRows, (state, { rows }) => updateRows(state, rows)),
);

function updateRows(state: DashboardState, rows: DashboardRow[]): DashboardState {
    return { ...state, rows };
}

function setEditMode(state: DashboardState, editMode: boolean): DashboardState {
    return { ...state, editMode: editMode };
}

function setPageName(state: DashboardState, name: string): DashboardState {
    return { ...state, name };
}

function setPages(state: DashboardState, pages: DashboardPage[]): DashboardState {
    let name = state.name;
    if (!pages.find(page => page.name === state.name)) {
        name = pages[0].name;
    }

    return { ...state, pages, name };
}

function updatePage(state: DashboardState, page: DashboardPage, rows?: DashboardRow[]): DashboardState {
    const pages = [...state.pages];
    const index = pages.findIndex(item => item.name === page.name);
    pages[index] = page;

    return rows ? { ...state, pages, rows } : { ...state, pages };
}

function deletePage(state: DashboardState, page: DashboardPage): DashboardState {
    const pages = [...state.pages];
    const index = pages.indexOf(page);
    if (index < 0) {
        return state;
    }

    pages.splice(index, 1);
    if (pages.length === 0) {
        pages.push({ name: createPageName(pages), items: [], requests: [] });
    }

    return { ...state, pages, name: pages[Math.min(pages.length - 1, index)].name };
}

function renamePage(state: DashboardState, page: DashboardPage, name: string): DashboardState {
    const index = state.pages.indexOf(page);
    if (index < 0) {
        return state;
    }

    const pages = [...state.pages];
    pages[index] = { ...page, name };
    return state.name === page.name ? { ...state, pages, name } : { ...state, pages };
}

function addNewPage(state: DashboardState, name?: string): DashboardState {
    name = name?.trim() ?? createPageName(state.pages);
    const page: DashboardPage = {
        name: name,
        items: [],
        requests: [],
    };

    const pages = [...state.pages, page];
    return { ...state, pages, name };
}

function setState(state: DashboardState): DashboardState {
    return state;
}
