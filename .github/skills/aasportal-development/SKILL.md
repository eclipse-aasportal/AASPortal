---
name: aasportal-development
description: 'Develop, test, debug, or review the AASPortal npm-workspace monorepo. Use when changing AAS models, Node services, Angular applications, AAS indexing, MySQL schemas, SQL queries, or workspace build and test configuration.'
argument-hint: 'Describe the AASPortal change, bug, or verification needed.'
---

# AASPortal Development

Use this skill for changes in the AASPortal monorepo.

## Project Map

- `projects/aas-core`:  platform-neutral library, AAS data models and platform-neutral utilities.
- `projects/aas-package`: reusable Node.js library, AASX package reading and writing, logging.
- `projects/aas-node`: Node.js, Express backend and indexing implementation.
- `projects/aas-lib`: reusable Angular UI components and services.
- `projects/aas-portal`: Angular portal application.
- `projects/aas-server`: Node.js, AAS server implementation.
- `projects/aas-browser`: Angular browser for the AAS server.
- `projects/aasportal-index/schema.sql`: MySQL index schema.

The repository uses TypeScript, ESM, npm workspaces, and Node.js 24. Keep ESM import specifiers compatible with the emitted JavaScript, including the `.js` extension for local imports where the existing code does so.

## Workflow

1. Identify the owning workspace and read its `package.json`, the nearby implementation, and a focused test before editing.
2. Keep changes inside the owning package unless a public cross-workspace contract must change.
3. Preserve the repository style: four-space indentation, single quotes, semicolons, trailing commas, and a 120-character print width.
4. Add or update focused Vitest coverage for behavior changes when a neighboring test pattern exists.
5. Run the narrowest relevant check, then the workspace test or build when the change affects compiled behavior.

## Angular 22

- Build standalone components: declare template dependencies in the component `imports` array rather than using NgModules.
- Prefer signals for component and local UI state. Derive state with `computed`, update writable signals with `set` or `update`, and avoid duplicating derived values in mutable state.
- Use `inject()` for dependency injection and Angular signal queries such as `viewChild` and `contentChild` for view queries. Use constructor injection only when a base class or another Angular API requires it.
- Keep components focused on presentation and interaction; move reusable or shared state and side effects into services or state classes.
- Use `ChangeDetectionStrategy.OnPush` for new components unless the component has a documented compatibility reason not to. Do not introduce Zone.js-dependent behavior; preserve the zoneless test setup with `provideZonelessChangeDetection()`.
- Prefer the built-in template control flow (`@if`, `@for`, and `@switch`) in new or substantially revised templates. For repeated lists, provide a stable `track` expression.
- Use `input`, `output`, and `model` APIs for new component contracts where they fit the existing public API. Preserve existing decorator-based public APIs unless migration is part of the change.
- Test through public component behavior, templates, and services. Use Angular's `TestBed`, Vitest, and `provideZonelessChangeDetection()` consistently with neighboring tests.
- Use Bootstrap 5 and ng-bootstrap for creating the HTML design.

## Commands

Run commands from the repository root.

```bash
npm run test -w <workspace>
npm run lint -w <workspace>
npm run build -w <workspace>
npm run lint
npm run build
npm run test
```

For local end-to-end development, use `npm run serve`. It builds all workspaces and starts the Node server using `projects/aas-node/.env`.

## Index and Database Changes

- Keep `projects/aasportal-index/schema.sql` synchronized with the queries and row interfaces in `projects/aas-node/src/app/index/`.
- `documents.uuid` identifies a document; related rows in `elements` use the same `uuid`.
- Use bound parameters for values in MySQL queries (`?` with `mysql2/promise`) and SQLite queries. Never interpolate input into SQL.
- AAS `idShort` is at most 128 characters; preserve `VARCHAR(128)` for indexed `idShort` fields.
- For document searches that include elements, use `EXISTS` over `elements` rather than an unrestricted join so one matching element cannot duplicate a document result.
- Treat `%` and `_` as SQL `LIKE` wildcards only when that behavior is intended; escape them when the API promises literal text search.

## Validation

Use the most focused validation available first. For changes to shared models, public APIs, generated TSOA routes, schema contracts, or cross-workspace imports, additionally run the relevant workspace build. Do not repair unrelated test failures; report them with their command and failure summary.