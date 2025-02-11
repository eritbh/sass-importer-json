# lol

lmao

## erin what the fuck are you doing

look man i just. i wrote this stylesheet for a subreddit a long time ago right.
and one of the things they wanted it to do was for people to be able to use
big-ass emoji image things by typing certain links into their comments. and it
turns out back before new reddit existed and custom emoji support and the
ability to embed gifs in comments and all this other shit was a thing, that got
pretty popular. so the subreddit has like. several dozens of these things now,
and some of them are even animated via `@keyframes` spritesheet hackery, and
reddit stylesheets are size capped so sometimes the mods remove some of them in
order to make room for new ones, its like this whole thing now right? and
basically my personal hell is these two [massive][1] [files][2] which do nothing
except define two gigantic sass maps which contain all the definitions for every
comment face which exists. and look sass is a great language and everything but
it wasnt made for this shit right, you dont want to have to deal with fucking
scss syntax every time you want to make a change to this file, it has data types
and inconsistent quoting rules and all these things that make it a fucking
minefield for anyone that doesnt have seventy five years of web dev experience
to edit. so i wrote this plugin, so those files can at least be massive JSON
blobs, instead of massive SCSS blobs. which is probably marginally better. maybe
someday ill even make a tool that can read those JSON blobs and then let people
edit them from the tool and then write the blobs back out and if i ever do that
hypothetical thing which will definitely happen soon tm then i won't need to
worry about serializing to/from scss it'll just roundtrip to json which is much
better

im not coping youre coping

[1]: https://github.com/r-anime/stylesheet/blob/e398e51dd135fc6af0f572f8410f0471e6d10ce4/src/_commentfaces-static.scss
[2]: https://github.com/r-anime/stylesheet/blob/e398e51dd135fc6af0f572f8410f0471e6d10ce4/src/_commentfaces-animated.scss

## usage

> [!IMPORTANT]
> this shit aint ready yet lol. `npm i github:eritbh/sass-importer-json` if you
> insist on installing it

Add the default export to the `importers` array when you call `sass.compile` or
`sass.compileAsync` from the dart sass JS API.

`build.js`:

```js
import sass from 'sass';
import jsonImporter from 'sass-importer-json';

const output = sass.compile('style.scss', {
	importers: [jsonImporter],
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
@use "thing.json" as myStuff;

.something::after {
	content: myStuff.$foo;
	font-size: myStuff.$bar * 1px;
}
```

in your terminal:

```
$ node build.js
.something::after {
  content: "i am a string";
  font-size: 42px;
}
```

## development

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

## license

[WTFPL](/LICENSE)
