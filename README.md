# sass-importer-json

Dart Sass importer for reading values in JSON files (or most other key-value-ish
files) into Sass/SCSS variables.

## Usage

    npm install -D --production sass-importer-json

The default export is a function which takes an options object and returns an
importer. Add the returned importer to the `importers` array when you call
`sass.compile` or `sass.compileAsync` from [the Dart Sass JS API][sass-api].

### Options

- `extensions`: Defaults to `['.json']`. List of file extensions the importer
  will recognize and attempt to load.
- `parse`: Defaults to `JSON.parse`, but can be any function which receives file
  contents as a string and returns a value. Its return value will be read as a
  dict whose entries will become the file's declared Sass variables.
- `encoding`: Defaults to `'utf-8'` which is almost certainly what you want, but
  you can pass [any encoding Node supports][node-encodings]

### Examples

#### Basic Usage

`build.js`:

```js
import sass from 'sass';
import jsonImporter from 'sass-importer-json';

const output = sass.compile('style.scss', {
	importers: [jsonImporter()],
});

// log it, write it, stick it in a stew
console.log(output.css);
```

`data.json`:

```json
{
	"foo": "i am a string",
	"bar": 42
}
```

`style.scss`:

```scss
@use "data";

.something::after {
	content: data.$foo;
	font-size: daa.$bar * 1px;
}
```

Then, in your terminal:

```
$ node build.js
.something::after {
  content: "i am a string";
  font-size: 42px;
}
```

#### Custom formats

With the `parse` and `extensions` options, you can add support for importing
custom syntaxes like [JSONC][jsonc-parser] or [JSON5][json5], or even completely
different formats like [YAML][yaml]. Basically any format consisting of
key-value pairs can probably be used with this importer if you set an
appropriate `parse` function:

```js
import {compile} from 'sass';
import jsonImporter from 'sass-importer-json';

import JSON5 from 'json5';
import JSONC from 'jsonc-parser';
import YAML from 'yaml';

const out = compile('style.scss', {
	importers: [
		jsonImporter({
			extensions: ['.json', '.jsonc'],
			parse: JSONC.parse,
		}),
		jsonImporter({
			extensions: ['.json5'],
			parse: JSON5.parse,
		}),
		jsonImporter({
			extensions: ['.yml', '.yaml'],
			parse: YAML.parse,
		}),
	],
});
```

You don't have to pass a library function directly to `parse` - you can also
write a custom function which takes a string and returns a file's contents. This
can be useful to pass custom options to other parsers, or to pass a reviver to
standard `JSON.parse`:

```js
import {compile} from 'sass';
import jsonImporter from 'sass-importer-json';
import YAML from 'yaml';

const out = compile('style.scss', {
	importers: [jsonImporter({
		extensions: ['.yaml', '.yml'],
		parse: value => YAML.parse(value, undefined, {stringKeys: true});
	})],
});
```

## License

[WTFPL](/LICENSE)

[json5]: https://www.npmjs.com/package/json5
[jsonc-parser]: https://www.npmjs.com/package/jsonc-parser
[node-encodings]: https://nodejs.org/api/buffer.html#buffers-and-character-encodings
[sass-api]: https://sass-lang.com/documentation/js-api/
[yaml]: https://www.npmjs.com/package/yaml
