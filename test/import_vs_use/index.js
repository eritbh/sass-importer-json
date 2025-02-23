import assert from 'node:assert';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {compile, Logger} from 'sass';
import jsonImporter from '../../dist/index.js';
const dir = dirname(new URL(import.meta.url).pathname);

test('usage from @import succeeds', t => {
	const {css} = compile(join(dir, 'import.scss'), {
		importers: [jsonImporter()],
		logger: Logger.silent,
	});

	assert.strictEqual(
		css.trim(),
		`
			:root {
			  --a: 1;
			  --b: 2;
			  --c: 3;
			  --d: 4;
			}
		`.trim().replace(/^\t+/gm, ''),
	);
});

test('not loaded via @use', t => {
	Array(4).map((_, i) => {
		assert.throws(() => {
			compile(join(dir, `use${i + 1}.scss`));
		});
	});
});
