/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import semver from 'semver';
import {
    aas,
    ApplicationError,
    convertToString,
    getLocaleValue,
    getPreferredName,
    AASDocument,
    isSubmodelElementCollection,
    getReferable,
    isProperty,
    isMultiLanguageProperty,
    getIEC61360Content,
    isFile,
    isSubmodelElementList,
    getUnit,
    toDisplayValue,
    getChildren,
    getSemanticId,
    isErrorData,
    isSubmodel,
    isEnvironment,
    AASEndpointType,
} from 'aas-core';

import {
    DataSheetData,
    DataSheetItem,
    DataSheetItemOptions,
    DataSheetOptions,
    ViewRoute,
    ViewRouteMap,
    ViewRouteResult,
} from './types';

/**
 * Converts a message to a localized text.
 * @param message The current message.
 * @param translate The translate service.
 * @returns The message as localized text.
 */
export function messageToString(message: unknown, translate: TranslateService): string {
    let text: string;
    if (message instanceof ApplicationError) {
        text = translate.instant(message.message, message.args);
    } else if (typeof message === 'string') {
        text = message;
    } else if (message instanceof HttpErrorResponse) {
        if (isErrorData(message.error)) {
            text = translate.instant(message.error.message, message.error.args);
        } else {
            text = message.message ?? `${message.status} ${message.message}`;
        }
    } else if (message instanceof Error) {
        text = message.message;
    } else if (isErrorData(message)) {
        text = translate.instant(message.message, message.args);
    } else {
        text = convertToString(message);
    }

    return text;
}

/**
 * Gets the file name of the specified file path.
 * @param path The file path.
 * @returns The file name.
 */
export function basename(path: string): string {
    let index = path.lastIndexOf('/');
    if (index < 0) {
        index = path.lastIndexOf('\\');
    }

    return index < 0 ? path : path.substring(index + 1);
}

/**
 * Gets the extension of the specified file path.
 * @param path The file path.
 * @returns The extension.
 */
export function extension(path: string): string | undefined {
    const name = basename(path);
    const index = name.lastIndexOf('.');
    return index < 0 ? undefined : name.substring(index);
}

/**
 * Encodes a string to Base64Url.
 * @param str The string to encode.
 * @returns The encoded string.
 */
export function encodeBase64Url(str: string): string {
    const utf8Bytes = new TextEncoder().encode(str);
    let binary = '';
    utf8Bytes.forEach(b => (binary += String.fromCharCode(b)));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes a Base64Url string.
 * @param str The encoded string.
 * @returns The decoded string.
 */
export function decodeBase64Url(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }

    const binary = atob(str);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

/**
 * Checks if the specified string is base64 encoded
 * @param s The string to test.
 * @return true if base64 encoded
 */
export function isBase64(s: string): boolean {
    return /^[A-Za-z0-9+/]*[=]{0,2}$/.test(s);
}

/**
 * Converts a Blob to a base64 encoded string.
 * @param blob The current Blob.
 * @returns The base64 encoded string.
 */
export function convertBlobToBase64Async(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = (): void => {
            const base64WithDataUrlPrefix = reader.result as string;
            const index = base64WithDataUrlPrefix.indexOf(';base64,');
            const base64 = base64WithDataUrlPrefix.substring(index + 8);
            resolve(base64);
        };

        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Determines the display name for the specified Referable.
 * @param referable The current Referable.
 * @param env The Environment of the Referable.
 * @param currentLang The current language to get the display name for.
 * @returns The display name.
 */
export function getDisplayName(referable: aas.Referable, env?: aas.Environment | null, currentLang?: string): string {
    if (referable.displayName) {
        const value = getLocaleValue(referable.displayName, currentLang);
        if (value) {
            return value;
        }
    }

    if (env) {
        const values = getPreferredName(env, referable);
        if (values) {
            const value = getLocaleValue(values, currentLang);
            if (value) {
                return value;
            }
        }
    }

    return toDisplayName(referable.idShort);
}

/**
 * Computes a has code of the specified string value.
 * @param value The current value.
 * @returns The has code of the specified value.
 */
export function hashCode(value: string): number {
    let hash = 0;
    if (value.length === 0) {
        return hash;
    }

    for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }

    return hash >= 0 ? hash : 4294967296 + hash;
}

/**
 * Converts an `aas.Reference` object to its string representation by joining the values
 * of its keys with a dot separator.
 *
 * @param value - The `aas.Reference` object to convert.
 * @returns The string representation of the reference, with key values joined by dots.
 */
export function referenceToString(value: aas.Reference): string {
    return value.keys.map(key => key.value).join('.');
}

/**
 * Type guard to check if a given value is an array of `aas.LangString` objects.
 *
 * This function verifies that the input is a non-empty array and that the first element
 * has both `language` and `text` properties of type `string`.
 *
 * @param value - The value to check.
 * @returns `true` if the value is an array of `aas.LangString`, otherwise `false`.
 */
export function isLangString(value: unknown): value is aas.LangString[] {
    if (!Array.isArray(value) || value.length === 0) {
        return false;
    }

    const langString = value[0] as aas.LangString;
    return typeof langString.language === 'string' && typeof langString.text === 'string';
}

/**
 * Gets the URL to the content of the specified file.
 * @param document The AAS document.
 * @param file The current file.
 * @returns The URL to the content of the specified file.
 */
export function getUrl(document: AASDocument, file: aas.File | undefined): string | undefined {
    if (file === undefined || file.value === undefined || !file.path) {
        return undefined;
    }

    const smId = encodeBase64Url(file.path.id);
    const path = file.path.idShortPath;
    const name = encodeBase64Url(document.endpoint);
    const id = encodeBase64Url(document.id);
    return `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/submodel-elements/${path}/value`;
}

/**
 * Creates a data sheet from the specified submodel, submodel element list or collection.
 * @param document The AAS document.
 * @param sm The submodel or submodel element.
 * @param lang The current language.
 * @param options The options to create the data sheet.
 * @returns An object of type `DataSheetData`.
 */
export function createDataSheet(
    document: AASDocument,
    sm: aas.SubmodelElement | aas.Submodel,
    lang: string,
    options?: DataSheetOptions,
): DataSheetData {
    const dataSheet: DataSheetData = {
        name: '',
        collapsed: false,
        items: [],
    };

    const env = document.content;
    if (!env) {
        return dataSheet;
    }

    dataSheet.name = options?.name ?? getDisplayName(sm, env, lang);

    if (options?.type === 'A') {
        for (const itemOptions of options.include) {
            let item: DataSheetItem | undefined;
            if (typeof itemOptions === 'string') {
                item = createItem(getReferable(sm, itemOptions), env);
            } else {
                item = createItem(
                    itemOptions.idShortPath ? getReferable(sm, itemOptions.idShortPath) : sm,
                    env,
                    itemOptions,
                );
            }

            if (item) {
                dataSheet.items.push(item);
            }
        }
    } else {
        const exclude = new Set(options?.exclude);
        const itemOptions = options?.items;
        for (const referable of getChildren(sm)) {
            if (exclude.has(referable.idShort)) {
                continue;
            }

            const item = createItem(
                referable,
                env,
                itemOptions?.find(item => item.idShortPath === referable.idShort),
            );

            if (item) {
                dataSheet.items.push(item);
            }
        }
    }

    return dataSheet;

    function createItem(
        referable: aas.Referable | undefined,
        env: aas.Environment | undefined,
        option?: DataSheetItemOptions,
    ): DataSheetItem | undefined {
        if (!referable) {
            return undefined;
        }

        if (isFile(referable) && !option?.getUrl) {
            option = option ? { ...option, getUrl: resolveUrl } : { type: 'url', getUrl: resolveUrl };
        }

        return createDataSheetItem(referable, env, lang, option);
    }

    function resolveUrl(referable: aas.Referable): string | undefined {
        if (isFile(referable)) {
            return getUrl(document, referable);
        }

        return undefined;
    }
}

/**
 * Creates a data sheet item.
 * @param element
 * @param env
 * @param lang
 * @returns
 */
export function createDataSheetItem(
    element: aas.Referable,
    env: aas.Environment | undefined,
    lang: string | undefined,
    options?: DataSheetItemOptions,
): DataSheetItem | undefined {
    let dataSpecification: aas.DataSpecificationIec61360 | undefined;
    if (env) {
        dataSpecification = getIEC61360Content(env, element);
    }

    const value = getValue(element, options);
    if (!value) {
        return undefined;
    }

    let displayName: string | undefined;
    if (element.displayName) {
        displayName = getLocaleValue(element.displayName, lang);
    }

    if (!displayName && dataSpecification?.preferredName) {
        displayName = getLocaleValue(dataSpecification.preferredName);
    }

    if (!displayName) {
        displayName = toDisplayName(element.idShort);
    }

    let description: string | undefined;
    if (element.description) {
        description = getLocaleValue(element.description, lang);
    }

    if (!description && dataSpecification?.definition) {
        description = getLocaleValue(dataSpecification.definition);
    }

    const item: DataSheetItem = {
        idShort: element.idShort,
        displayName,
        value,
    };

    if (options?.getUrl) {
        item.url = options.getUrl(element);
    }

    if (description) {
        item.description = description;
    }

    return item;

    function getValue(element: aas.Referable, options?: DataSheetItemOptions): string | string[] | undefined {
        if (isProperty(element)) {
            const unit = dataSpecification?.unit;
            return lang ? toDisplayValue(element.value, element.valueType, lang, unit) : element.value;
        }

        if (isMultiLanguageProperty(element)) {
            return getLocaleValue(element.value, lang);
        }

        if (isFile(element)) {
            return element.value ? basename(element.value) : '-';
        }

        if (isSubmodelElementList(element) || isSubmodelElementCollection(element)) {
            if (!element.value) {
                return undefined;
            }

            if (options?.type === 'format') {
                return formatValue(element, options.format);
            } else if (options?.type === 'join') {
                return joinValue(element, options.join, options.separator);
            }

            const values: string[] = [];
            for (const item of element.value) {
                const v = getValue(item);
                if (!v) {
                    continue;
                }

                if (typeof v === 'string') {
                    values.push(v);
                } else {
                    values.push(v.join('; '));
                }
            }

            return values;
        }

        return undefined;

        function formatValue(sm: aas.SubmodelElementList | aas.SubmodelElementCollection, format: string): string {
            const regex = /{([^{}]+)}/g;
            return format.replace(regex, (x, y) => {
                const referable = getReferable(sm, y);
                if (!referable) {
                    return x;
                }

                const value = getValue(referable);
                if (!value) {
                    return x;
                }

                return Array.isArray(value) ? value.join(' ') : value;
            });
        }

        function joinValue(sm: aas.SubmodelElement, idShortPaths: string[], separator: string): string {
            const values: string[] = [];
            for (const idShortPath of idShortPaths) {
                const referable = getReferable(sm, idShortPath);
                if (!referable) {
                    continue;
                }

                const value = getValue(referable);
                if (value) {
                    values.push(Array.isArray(value) ? value.join(' ') : value);
                }
            }

            return values.join(separator);
        }
    }
}

/**
 * Converts a name to a more readable display name.
 * @param name The current name.
 * @returns A display name.
 */
export function toDisplayName(name: string): string {
    const LOWER = 0;
    const UPPER = 1;
    const words: string[] = [];
    let currentCase = LOWER;
    let word = '';
    for (let i = 0, n = name.length; i < n; i++) {
        const c = name.charAt(i);
        const charCase = getCharCase(c);
        if (c === '_') {
            if (word.length > 0) {
                words.push(word);
                word = '';
            }

            continue;
        }

        if (i === 0) {
            currentCase = charCase;
            word += c;
        } else {
            if (currentCase === charCase) {
                if (currentCase === UPPER && i < n - 1) {
                    const next = name.charAt(i + 1);
                    if (getCharCase(next) === LOWER) {
                        words.push(word);
                        word = c;
                    } else {
                        word += c;
                    }
                } else {
                    word += c;
                }
            } else {
                if (charCase === UPPER) {
                    words.push(word);
                    word = c;
                } else {
                    word += c;
                }

                currentCase = charCase;
            }
        }
    }

    if (word.length > 0) {
        words.push(word);
    }

    return words.map((word, i) => (i > 0 && hasAnyLowerCase(word) ? word.toLowerCase() : word)).join(' ');

    function getCharCase(c: string): number {
        return c === c.toUpperCase() ? UPPER : LOWER;
    }

    function hasAnyLowerCase(s: string): boolean {
        for (let i = 0, n = s.length; i < n; i++) {
            if (s.charAt(i) === s.charAt(i).toLowerCase()) {
                return true;
            }
        }

        return false;
    }
}

/**
 * Gets the display value of a submodel element.
 * @param submodel The current submodel.
 * @param idShortPath The path to the submodel element.
 * @param lang The current language.
 * @param env The AAS environment used to get the concept description.
 * @param defaultValue A default value if no value exists.
 * @returns The display value.
 */
export function toString(
    submodel: aas.Submodel,
    idShortPath: string,
    lang: string,
    env?: aas.Environment | null,
    defaultValue: string = '',
): string {
    const referable = getReferable(submodel, idShortPath);
    if (!referable) {
        return defaultValue;
    }

    return getDisplayValue(referable, lang, env, defaultValue);
}

/**
 * Gets the display value of a referable element.
 * @param referable The referable element.
 * @param lang The current language.
 * @param env The AAS environment used to get the concept description.
 * @param defaultValue A default value if no value exists.
 * @returns The display value.
 */
export function getDisplayValue(
    referable: aas.Referable,
    lang: string,
    env?: aas.Environment | null,
    defaultValue: string = '',
): string {
    let value: string | undefined;
    if (isProperty(referable)) {
        let unit: string | undefined;
        if (env) {
            unit = getUnit(env, referable);
        }

        switch (referable.valueType) {
            case 'xs:double':
            case 'xs:integer':
            case 'xs:decimal':
            case 'xs:date':
            case 'xs:dateTime':
            case 'xs:time':
                value = toDisplayValue(referable.value, referable.valueType, lang, unit);
                break;
            case 'xs:string':
                value = referable.value;
                break;
            default:
                value = referable.value;
                break;
        }
    } else if (isMultiLanguageProperty(referable)) {
        value = getLocaleValue(referable.value, lang);
    }

    return value ?? defaultValue;
}

/**
 * Determines whether the specified object is empty.
 * @param obj The current object.
 * @returns `true` if the specified object is empty; otherwise `false`.
 */
export function isEmpty(obj: object): boolean {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
            return false;
        }
    }

    return true;
}

/**
 * Returns the first occurrence of a submodel whose semantic ID matches one from the specified list.
 * @param document The current AAS document.
 * @param semanticIds A list of semantic IDs.
 * @returns A submodel or `undefined`.
 */
export function findSubmodel(document: AASDocument, semanticIds: string[]): aas.Submodel | undefined {
    const env = document?.content;
    if (!env) {
        return undefined;
    }

    return env.submodels.find(submodel => {
        const semanticId = getSemanticId(submodel);
        if (!semanticId) {
            return false;
        }

        return semanticIds.indexOf(semanticId) >= 0;
    });
}

/**
 * Returns the route that corresponds to the specified Submodel.
 * @param viewRoutes The available view routes.
 * @param submodel The current Submodel.
 * @param defaultRoute Indicates to return the default route.
 * @returns The route or `undefined`.
 */
export function findRouteForSubmodel(
    viewRoutes: ViewRoute[],
    submodel: aas.Submodel,
    defaultRoute = true,
): ViewRoute | undefined {
    const semanticId = getSemanticId(submodel);
    for (const route of viewRoutes) {
        if (route.data.type !== 'Leaf') {
            continue;
        }

        if (semanticId && route.data.semanticIds) {
            if (route.data.semanticIds.indexOf(semanticId) >= 0) {
                return route;
            }
        }

        if (route.data.idShorts) {
            for (const idShort of route.data.idShorts) {
                if (submodel.idShort === idShort) {
                    return route;
                }
            }
        }
    }

    return defaultRoute ? viewRoutes.find(item => item.data.type === 'Default') : undefined;
}

/**
 * Returns the route that corresponds to the specified AAS document or AAS environment.
 * @param viewRoutes The available view routes.
 * @param arg The current AAS document or AAS environment.
 * @param defaultRoute Indicates to return the default route.
 * @returns The route or `undefined`.
 */
export function findRouteForShell(
    viewRoutes: ViewRoute[],
    arg: AASDocument | aas.Environment,
    defaultRoute = true,
): ViewRouteResult {
    const env = isEnvironment(arg) ? arg : arg.content;
    if (!env) {
        return {};
    }

    const { route, map } = findCompositionRoute(env);
    if (route) {
        return { route, map };
    }

    return defaultRoute ? { route: viewRoutes.find(item => item.data.type === 'Default') } : {};

    function findCompositionRoute(env: aas.Environment): ViewRouteResult {
        const leafRoutes = new Map<string, ViewRoute>(
            viewRoutes.filter(route => route.data.type === 'Leaf').map(route => [route.path!, route]),
        );

        const submodelSemanticIds = new Map<string, aas.Submodel>();
        for (const submodel of env.submodels) {
            const semanticId = getSemanticId(submodel);
            if (semanticId) {
                submodelSemanticIds.set(semanticId, submodel);
            }
        }

        const map: ViewRouteMap = {};
        for (const route of viewRoutes) {
            if (route.data.type !== 'Composition') {
                continue;
            }

            for (const path of route.data.routes) {
                const leafRoute = leafRoutes.get(path);
                if (!leafRoute) {
                    return {};
                }

                if (leafRoute.data.type !== 'Leaf') {
                    continue;
                }

                const data = leafRoute.data;
                if (data.semanticIds && data.semanticIds.length) {
                    const semanticId = data.semanticIds.find(id => submodelSemanticIds.has(id));
                    if (!semanticId) {
                        return {};
                    }

                    map[leafRoute.path!] = submodelSemanticIds.get(semanticId)!;
                }

                if (data.idShorts) {
                    let submodel: aas.Submodel | undefined;
                    for (const idShort of data.idShorts) {
                        const submodel = env.submodels.find(submodel => submodel.idShort === idShort);

                        if (submodel) {
                            break;
                        }
                    }

                    if (!submodel) {
                        return {};
                    }

                    map[leafRoute.path!] = submodel;
                }
            }

            return { route, map };
        }

        return {};
    }
}

/**
 * Determine whether the specified Submodel, AAS document or AAS environment has a specific view.
 * @param viewRoutes The available view routes.
 * @param arg The current Submodel, AAS document or AAS environment.
 * @returns `true` if a specific view exists; otherwise; `false`.
 */
export function hasSpecificView(viewRoutes: ViewRoute[], arg: aas.Submodel | AASDocument | aas.Environment): boolean {
    if (isSubmodel(arg)) {
        return findRouteForSubmodel(viewRoutes, arg, false) !== undefined;
    }

    const { route } = findRouteForShell(viewRoutes, arg, false);
    return route !== undefined;
}

/**
 * Validates the specified endpoint URL based on the endpoint type.
 * @param value The endpoint URL to validate.
 * @param type The type of the endpoint.
 * @returns `undefined` if the endpoint URL is valid for the specified type; otherwise an error ID.
 */
export function validateEndpointUrl(value: string, type: AASEndpointType): string | undefined {
    try {
        const url = new URL(value);
        switch (type) {
            case 'AAS_API':
                return validateAASApiEndpoint(url);
            case 'FileSystem':
                return validateFileSystemEndpoint(url);
            case 'OPC_UA':
                return validateOpcuaEndpoint(url);
            case 'WebDAV':
                return validateWebDAVEndpoint(url);
        }
    } catch (error) {
        return error?.message;
    }

    function validateAASApiEndpoint(url: URL): string | undefined {
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return 'HTTP_OR_HTTPS_PROTOCOL_REQUIRED';
        }

        if (!url.hostname) {
            return 'HOSTNAME_REQUIRED';
        }

        if (!url.pathname.endsWith('/')) {
            return 'ENDING_SLASH_REQUIRED';
        }

        const version = url.searchParams.get('version');
        if (version && !semver.valid(semver.coerce(version))) {
            return 'INVALID_VERSION';
        }

        return undefined;
    }

    function validateFileSystemEndpoint(url: URL): string | undefined {
        if (url.protocol !== 'file:') {
            return 'FILE_PROTOCOL_REQUIRED';
        }

        if (url.hostname !== '') {
            return 'EMPTY_HOSTNAME_REQUIRED';
        }

        if (url.pathname === '/') {
            return 'PATHNAME_REQUIRED';
        }

        return undefined;
    }

    function validateOpcuaEndpoint(url: URL): string | undefined {
        if (url.protocol !== 'opc.tcp:') {
            return 'OPC_TCP_PROTOCOL_REQUIRED';
        }

        if (!url.hostname) {
            return 'HOSTNAME_REQUIRED';
        }

        return undefined;
    }

    function validateWebDAVEndpoint(url: URL): string | undefined {
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return 'HTTP_OR_HTTPS_PROTOCOL_REQUIRED';
        }

        if (!url.hostname) {
            return 'HOSTNAME_REQUIRED';
        }

        return undefined;
    }
}
