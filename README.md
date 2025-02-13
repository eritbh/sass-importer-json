# sass-importer-json

Dart Sass importer for reading values in JSON files into Sass/SCSS variables.

## Usage

    npm i sass-importer-json

The default export is a function which takes an options object and returns an
importer. Add the returned importer to the `importers` array when you call
`sass.compile` or `sass.compileAsync` from [the Dart Sass JS API][sass-api].

### Options

- `encoding`: Defaults to `'utf-8'` which is almost certainly what you want, but
  you can pass [any encoding Node supports][node-encodings]

### Example

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
// recommended to use `as` to put the values in a namespace - not required tho
@use "data.json";

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

## Development

- `npm run fmt` to format code with dprint
- `npm run build` to build the typescript thingy

## todos

- alternate version that doesn't use `readFileSync` (is this important? what
  does the actual dart sass file loader do for normal sass files?)
- maybe handle color values somehow (all values are put in sass as quoted
  strings; converting from a string to a color from sass is impossible; people
  might want to be able to import a color value from sass and then modify it
  using `color.scale()` or whatever? unsure how important this is since you can
  also just pass colors as number tuples or some other consistent value and
  manually create the color values from those numbers from sass)
- figure out what the hell is going on with `containingUrl` in `canonicalize`
  because it would be nice to be able to use this loader with `compileString`

## License

[WTFPL](/LICENSE)

[sass-api]: https://sass-lang.com/documentation/js-api/
[node-encodings]: https://nodejs.org/api/buffer.html#buffers-and-character-encodings
