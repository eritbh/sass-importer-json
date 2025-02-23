import {readFileSync, statSync} from 'node:fs';
import {basename, dirname, extname, join} from 'node:path';
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
	/[_a-zA-Z\u0080-\uFFFF][-_a-zA-Z0-9\u0080-\uFFFF]*/;

/** Checks if a path exists and is a file. */
function fileExists (path: string) {
	try {
		return statSync(path).isFile();
	} catch (error) {
		return false;
	}
}

/** Checks if a path exists and is a directory. */
function dirExists (path: string) {
	try {
		return statSync(path).isDirectory();
	} catch (error) {
		return false;
	}
}

/**
 * Resolve an import path to the file on disk it references. If none is found,
 * returns `null`. If multiple equally-valid candidates are found, throws
 * an error. Otherwise, returns the resolved path.
 *
 * Basically a reimplementation of `resolveImportPath` from Dart Sass itself.
 *
 * @see https://sass-lang.com/documentation/js-api/interfaces/importer/#canonicalize
 * @see https://github.com/sass/dart-sass/blob/main/lib/src/importer/utils.dart
 */
function resolveImportPath (
	path: string,
	knownExts: string[],
	fromImport: boolean,
) {
	// e.g. if path is "path/to/foo.ext" these would be:
	const dir = dirname(path); // "path/to"
	const base = basename(path); // "foo.ext"
	const originalExt = extname(path); // ".ext"
	const name = base.substring(0, base.length - originalExt.length); // "foo"

	let exts: string[];
	if (originalExt && knownExts.includes(originalExt)) {
		// The path specified an extension we know, don't look for others
		exts = [originalExt];
	} else {
		// No extension specified, look for any we know about
		exts = knownExts;
	}

	/**
	 * Given a directory and a name without a file extension, searches for a
	 * file on disk whose name matches the input, accounting for partials and
	 * the precomputed set of potential file extensions. If there is no matching
	 * file, returns `null`. If there are multiple matching files, throws an
	 * error informing the user of the ambiguity. Otherwise, returns the path of
	 * the single matching file.
	 *
	 * For example, calling `disambiguate('path/to', 'foo')` will search the
	 * files `path/to/_foo.ext` and `path/to/foo.ext` for each potential file
	 * extension `.ext`.
	 */
	function disambiguate (dir: string, name: string) {
		let existing = exts.flatMap(ext => [
			join(dir, '_' + name + ext),
			join(dir, name + ext),
		]).filter(path => fileExists(path));
		if (existing.length > 1) {
			throw new Error(`Multiple matches: ${existing.join(', ')}`);
		}
		return existing[0] ?? null;
	}

	return (
		// path/to/_foo.import.ext (only when using @import)
		(fromImport ? disambiguate(dir, name + '.import') : null)
			// path/to/_foo.ext
			?? disambiguate(dir, name)
			// if there was no file extension to begin with, we might be resolving a directory
			?? ((!originalExt && dirExists(path))
				? (
					// path/to/foo/_index.import.ext (only when using import)
					(fromImport ? disambiguate(path, 'index.import') : null)
						// path/to/foo/_index.ext
						?? disambiguate(path, 'index')
				)
				: null)
	);
}

/**
 * An importer which handles including local `.json` files by converting their
 * top-level object keys into variables.
 *
 * All strings are converted to double-quoted string literals. All numbers are
 * treated as unitless. All arrays use square brackets. All map keys are quoted.
 */
export default ({
	extensions = ['.json'],
	parse = JSON.parse,
	encoding = 'utf-8',
}: {
	extensions?: `.${string}`[];
	parse?: (text: string) => Record<string, any>;
	encoding?: BufferEncoding;
} = {}) => ({
	canonicalize (path, context) {
		if (
			!context.containingUrl || context.containingUrl.protocol !== 'file:'
		) {
			return null;
		}
		const absolutePath = join(
			dirname(context.containingUrl.pathname),
			path,
		);
		const resolvedPath = resolveImportPath(
			// make referenced path absolute a
			absolutePath,
			extensions,
			context.fromImport,
		);
		if (!resolvedPath) {
			return null;
		}
		return new URL(`file://${resolvedPath}`);
	},
	load (canonicalUrl) {
		const json = parse(
			readFileSync(canonicalUrl.pathname, encoding),
		) as unknown;
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
