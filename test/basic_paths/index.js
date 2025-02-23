import assert from 'node:assert';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {compile} from 'sass';
import jsonImporter from '../../dist/index.js';
const dir = dirname(new URL(import.meta.url).pathname);

test('basic paths are resolved and values are pulled in', t => {
	const {css} = compile(join(dir, 'test.scss'), {
		importers: [jsonImporter()],
	});

	assert.strictEqual(
		css,
		`
			:root {
			  --a: 1;
			  --b: asdf asdf asdf;
			  --c: [multiple, things];
			  --d: bar;
			}
		`.trim().replace(/^\t+/gm, ''),
	);
});
