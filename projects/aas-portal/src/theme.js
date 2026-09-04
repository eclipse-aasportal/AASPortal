/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

// Applies runtime-configurable brand colors (primary, secondary) on top of the built-in Bootstrap
// theme compiled into styles.scss. This has to happen in plain JS, outside of Angular/Sass, because
// $primary/$secondary are baked into dozens of component-scoped CSS custom properties (--bs-btn-bg,
// --bs-pagination-active-bg, ...) as literal hex values at Sass *compile* time -- overriding just the
// --bs-primary/--bs-secondary variables themselves does not reach them, so this file re-derives the
// same values Bootstrap's own Sass mixins would have produced for a different base color, using the
// same tint/shade/contrast formulas, and injects them as a <style> override. See styles.scss for the
// equivalent build-time dark-mode-only version of this fix.
//
// Configuration sources, in increasing precedence (each optional and independent per color; if
// neither applies to a given color, the value compiled into styles.scss is used untouched):
//   1. THEME_PRIMARY_COLOR / THEME_SECONDARY_COLOR environment variables, baked into config.js by the
//      Docker entrypoint script.
//   2. assets/theme-config.json, e.g. { "primary": "#0057b8", "secondary": "#4b5563" }. Not baked into
//      the image: can be mounted into a running container (or replaced in an already-running one) to
//      override the theme without a rebuild, and without even restarting the container -- just replace
//      the file and reload the page. A key it omits falls back to that color's env var / built-in value.
//
// $primary alone additionally drives Bootstrap's "component active" color (pagination, dropdowns,
// nav-pills, list-group active state, progress bars, focus rings, form checks/ranges, ...) -- that set
// of overrides is primary-only by construction (see PRIMARY_ONLY_SELECTORS below), matching Bootstrap
// itself: $component-active-bg/$link-color are hardcoded to $primary, not parameterized per color.
(function (window, document) {
    'use strict';

    var HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

    // ---- Color math, mirroring Bootstrap's Sass color functions (scss/_functions.scss) ----

    var WHITE = { r: 255, g: 255, b: 255 };
    var BLACK = { r: 0, g: 0, b: 0 };

    function hexToRgb(hex) {
        var normalized = hex.replace('#', '');
        if (normalized.length === 3) {
            normalized = normalized.replace(/(.)/g, '$1$1');
        }

        var num = parseInt(normalized, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    function toHex(rgb) {
        function channel(c) {
            return ('0' + Math.max(0, Math.min(255, Math.round(c))).toString(16)).slice(-2);
        }

        return '#' + channel(rgb.r) + channel(rgb.g) + channel(rgb.b);
    }

    function toRgbString(rgb) {
        return Math.round(rgb.r) + ', ' + Math.round(rgb.g) + ', ' + Math.round(rgb.b);
    }

    // Sass mix(color1, color2, weight): weight is the share of color1 in the result.
    function mix(color1, color2, weight) {
        return {
            r: color1.r * weight + color2.r * (1 - weight),
            g: color1.g * weight + color2.g * (1 - weight),
            b: color1.b * weight + color2.b * (1 - weight),
        };
    }

    function tint(rgb, weight) {
        return mix(WHITE, rgb, weight);
    }

    function shade(rgb, weight) {
        return mix(BLACK, rgb, weight);
    }

    // WCAG relative luminance / contrast ratio, matching Bootstrap's color-contrast() with its
    // defaults (white/black candidates, 4.5 minimum contrast ratio).
    function relativeLuminance(rgb) {
        function linearize(c) {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        }

        return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
    }

    function contrastRatio(rgb1, rgb2) {
        var l1 = relativeLuminance(rgb1) + 0.05;
        var l2 = relativeLuminance(rgb2) + 0.05;
        return l1 > l2 ? l1 / l2 : l2 / l1;
    }

    function contrastColor(rgb) {
        return contrastRatio(rgb, WHITE) >= 4.5 ? WHITE : BLACK;
    }

    // Reproduces Bootstrap's button-variant()/button-outline-variant() Sass mixins for one background
    // color, using the same default shade/tint amounts (scss/_variables.scss $btn-*-amount).
    function buttonVariant(rgb) {
        var color = contrastColor(rgb);
        var needsShade = color === WHITE; // dark background -> light text -> further states get darker
        var hoverBg = needsShade ? shade(rgb, 0.15) : tint(rgb, 0.15);
        var hoverBorder = needsShade ? shade(rgb, 0.2) : tint(rgb, 0.1);
        var activeBg = needsShade ? shade(rgb, 0.2) : tint(rgb, 0.2);
        var activeBorder = needsShade ? shade(rgb, 0.25) : tint(rgb, 0.1);

        return {
            color: toHex(color),
            bg: toHex(rgb),
            border: toHex(rgb),
            hoverColor: toHex(contrastColor(hoverBg)),
            hoverBg: toHex(hoverBg),
            hoverBorder: toHex(hoverBorder),
            activeColor: toHex(contrastColor(activeBg)),
            activeBg: toHex(activeBg),
            activeBorder: toHex(activeBorder),
        };
    }

    // ---- CSS generation: one selector scope (":root" or the dark-mode selector) x one color name ----

    // Root-level tokens every named color gets: the raw variable + its derived subtle/emphasis tokens.
    // .alert-{name} and .list-group-item-{name} reference these via var() rather than baking a literal
    // value, so they update for free once these are overridden -- no selector-specific rule needed.
    function buildRootTokenCss(selector, name, rgb) {
        return (
            selector +
            ' {' +
            '--bs-' + name + ':' + toHex(rgb) + ';' +
            '--bs-' + name + '-rgb:' + toRgbString(rgb) + ';' +
            '--bs-' + name + '-bg-subtle:' + toHex(tint(rgb, 0.8)) + ';' +
            '--bs-' + name + '-border-subtle:' + toHex(tint(rgb, 0.6)) + ';' +
            '--bs-' + name + '-text-emphasis:' + toHex(shade(rgb, 0.6)) + ';' +
            '}'
        );
    }

    // .btn-{name}, .btn-outline-{name} and .text-bg-{name} bake the color as a literal value per
    // Bootstrap's button-variant()/button-outline-variant() mixins and the text-bg-* helper -- these
    // apply identically to every named color, not just primary.
    function buildButtonAndTextBgCss(selector, name, rgb) {
        var hex = toHex(rgb);
        var btn = buttonVariant(rgb);

        return (
            selector +
            ' .btn-' + name + '{--bs-btn-color:' + btn.color + ';--bs-btn-bg:' + btn.bg + ';--bs-btn-border-color:' + btn.border +
            ';--bs-btn-hover-color:' + btn.hoverColor + ';--bs-btn-hover-bg:' + btn.hoverBg + ';--bs-btn-hover-border-color:' + btn.hoverBorder +
            ';--bs-btn-active-color:' + btn.activeColor + ';--bs-btn-active-bg:' + btn.activeBg + ';--bs-btn-active-border-color:' + btn.activeBorder +
            ';--bs-btn-disabled-color:' + btn.color + ';--bs-btn-disabled-bg:' + btn.bg + ';--bs-btn-disabled-border-color:' + btn.border + '}' +
            selector +
            ' .btn-outline-' + name + '{--bs-btn-color:' + hex + ';--bs-btn-border-color:' + hex +
            ';--bs-btn-hover-color:' + btn.color + ';--bs-btn-hover-bg:' + hex + ';--bs-btn-hover-border-color:' + hex +
            ';--bs-btn-active-color:' + btn.color + ';--bs-btn-active-bg:' + hex + ';--bs-btn-active-border-color:' + hex +
            ';--bs-btn-disabled-color:' + hex + ';--bs-btn-disabled-border-color:' + hex + '}' +
            selector +
            ' .text-bg-' + name + '{color:' + btn.color + '}'
        );
    }

    // $primary alone also drives Bootstrap's "component active" color and $link-color -- these are
    // hardcoded to $primary in Bootstrap itself (not parameterized per color), so they only make sense
    // for the primary color, never for secondary/other named colors.
    function buildPrimaryOnlyCss(selector, rgb) {
        var hex = toHex(rgb);
        var rgbStr = toRgbString(rgb);
        var focusShadow = '0 0 0 0.25rem rgba(' + rgbStr + ', 0.25)';

        return (
            selector +
            ' {--bs-link-color:' + hex + ';--bs-link-color-rgb:' + rgbStr + ';--bs-focus-ring-color:rgba(' + rgbStr + ', 0.25);}' +
            selector +
            ' .pagination{--bs-pagination-active-bg:' + hex + ';--bs-pagination-active-border-color:' + hex +
            ';--bs-pagination-focus-box-shadow:' + focusShadow + '}' +
            selector +
            ' .dropdown-menu{--bs-dropdown-link-active-bg:' + hex + '}' +
            selector +
            ' .nav-pills{--bs-nav-pills-link-active-bg:' + hex + '}' +
            selector +
            ' .list-group{--bs-list-group-active-bg:' + hex + ';--bs-list-group-active-border-color:' + hex + '}' +
            selector +
            ' .progress-bar{--bs-progress-bar-bg:' + hex + '}' +
            selector +
            ' .accordion-button{--bs-accordion-btn-focus-box-shadow:' + focusShadow + '}' +
            selector +
            ' .btn-close{--bs-btn-close-focus-shadow:' + focusShadow + '}' +
            selector +
            ' .form-control:focus,' + selector + ' .form-select:focus{border-color:' + toHex(tint(rgb, 0.5)) + ';box-shadow:' + focusShadow + '}' +
            selector +
            ' .form-check-input:focus{border-color:' + toHex(tint(rgb, 0.5)) + ';box-shadow:' + focusShadow + '}' +
            selector +
            ' .form-check-input:checked,' + selector + ' .form-check-input[type=checkbox]:indeterminate{background-color:' + hex + ';border-color:' + hex + '}' +
            selector +
            ' .form-range::-webkit-slider-thumb{background-color:' + hex + '}' +
            selector +
            ' .form-range::-moz-range-thumb{background-color:' + hex + '}' +
            selector +
            ' .nav-link:focus-visible{box-shadow:' + focusShadow + '}'
        );
    }

    function buildColorScopeCss(selector, name, rgb) {
        var css = buildRootTokenCss(selector, name, rgb) + buildButtonAndTextBgCss(selector, name, rgb);
        if (name === 'primary') {
            css += buildPrimaryOnlyCss(selector, rgb);
        }

        return css;
    }

    // Angular's production build inlines Bootstrap's compiled ":root { --bs-primary: ... }" (and the
    // deferred stylesheet with .btn-primary etc.) into index.html *after* this script tag, so a plain
    // ":root"/".btn-primary" override of equal specificity loses the cascade regardless of where this
    // script is placed. Prefixing every selector with "html" (":root" already matches the <html>
    // element, so "html:root" still matches exactly the same node) adds one type-selector of
    // specificity, which reliably outranks Bootstrap's compiled rules independent of DOM/load order.
    function buildThemeCss(colors) {
        var css = '';
        Object.keys(colors).forEach(function (name) {
            var hex = colors[name];
            if (!hex) {
                return;
            }

            if (!HEX_PATTERN.test(hex)) {
                console.warn('[theme] Ignoring invalid color value for "' + name + '":', hex);
                return;
            }

            var base = hexToRgb(hex);
            // Same 40% tint Bootstrap itself uses for e.g. $primary-text-emphasis-dark -- see styles.scss.
            var darkBase = tint(base, 0.4);

            css += buildColorScopeCss('html:root', name, base);
            css += buildColorScopeCss('html:root[data-bs-theme="dark"]', name, darkBase);
        });

        return css;
    }

    function applyColors(colors) {
        var styleEl = document.getElementById('fhg-runtime-theme');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'fhg-runtime-theme';
            document.head.appendChild(styleEl);
        }

        try {
            styleEl.textContent = buildThemeCss(colors);
        } catch (error) {
            console.error('[theme] Failed to apply custom theme colors:', error);
        }
    }

    // 1) Docker env vars (already available synchronously -- config.js loads before this script).
    var envColors = {
        primary: window.__env__ && window.__env__.THEME_PRIMARY_COLOR,
        secondary: window.__env__ && window.__env__.THEME_SECONDARY_COLOR,
    };

    if (envColors.primary || envColors.secondary) {
        applyColors(envColors);
    }

    // 2) Optional external theme file. Fetched last so it wins over the env vars, per color -- a key it
    // omits falls back to that color's env var value. Its absence (404) is the expected default state.
    fetch('assets/theme-config.json', { cache: 'no-store' })
        .then(function (response) {
            return response.ok ? response.json() : null;
        })
        .then(function (config) {
            if (config) {
                applyColors({
                    primary: config.primary || envColors.primary,
                    secondary: config.secondary || envColors.secondary,
                });
            }
        })
        .catch(function () {
            // No theme-config.json mounted -- fall back to the env vars / built-in default.
        });
})(window, document);
