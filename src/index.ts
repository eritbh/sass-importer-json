import {readFileSync} from 'node:fs';
import type * as sass from 'sass';

/**
 * Quotes the given string as a Sass/SCSS double-quoted string literal.
 * @see https://sass-lang.com/documentation/values/strings/#escapes
 */
function stringToScssLiteral (str: string) {
	return `"${
		str
			.replace(/\\/g, '\\\\')
			.replace(/"/g, '\\"')
			.replace(/\n/g, '\a ')
	}"`;
}

/**
 * Converts any JSON value to a corresponding literal expression representation
 * in SCSS syntax.
 *
 * All strings are converted to double-quoted string literals. All numbers are
 * treated as unitless. All arrays use square brackets. All map keys are quoted.
 *
 * Throws if the provided value is not one of the basic JSON types (null,
 * boolean, string, number, array, or plain object/dictionary).
 */
function jsonToScssInner (value: unknown): string {
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}
	if (typeof value === 'string') {
		return stringToScssLiteral(value);
	}
	if (typeof value === 'number') {
		return value.toString(10);
	}
	if (typeof value === 'object') {
		if (value == null) {
			return 'null';
		}
		if (Array.isArray(value)) {
			return `[${value.map(v => jsonToScssInner(v)).join(', ')}]`;
		}
		// treat as dict
		return `(${
			Object.entries(value)
				.map(([key, value]) =>
					`${stringToScssLiteral(key)}: ${jsonToScssInner(value)}`
				)
				.join(', ')
		})`;
	}

	// there are no other types in JSON, wtf did we get passed, a BigInt??
	throw new Error('Invalid JSON value');
}

/** Imperfect regexp matching valid Sass identifiers. */
const sassVariableIdentifierRegExp =
	/[_a-zA-Z\u0080-\uFFFF][-_a-zA-Z0-9\u0080-\uFFFF]+/;

/**
 * An importer which handles including local `.json` files by converting their
 * top-level object keys into variables.
 *
 * All strings are converted to double-quoted string literals. All numbers are
 * treated as unitless. All arrays use square brackets. All map keys are quoted.
 */
export default ({encoding = 'utf-8'}: {
	encoding?: BufferEncoding;
} = {}) => ({
	canonicalize (url, context) {
		if (!url.endsWith('.json')) {
			return null;
		}
		if (!context.containingUrl) {
			throw new Error(
				'containingUrl is missing mom come pick me up im scared',
			);
		}
		return new URL(url, context.containingUrl);
	},
	load (canonicalUrl) {
		const json = JSON.parse(readFileSync(canonicalUrl.pathname, encoding));
		if (typeof json !== 'object' || json == null || Array.isArray(json)) {
			throw new Error('json file must contain a dict at the top level');
		}
		return {
			syntax: 'scss',
			contents: Object.entries(json).map(([key, value]) => {
				if (!key.match(sassVariableIdentifierRegExp)) {
					throw new Error(`"${key}" is not a valid variable name`);
				}
				return `$${key}: ${jsonToScssInner(value)};\n`;
			}).join(''),
		};
	},
} satisfies sass.Importer<'sync'>);
