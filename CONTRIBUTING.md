## Development scripts

- `npm run fmt` to format code with dprint
- `npm run fmt:check` to check code format without fixing
- `npm run build` to build the typescript project
- `npm run test` to run test cases against build output

## todos

- alternate version that doesn't use `readFileSync` (is this important? what
  does the actual dart sass file loader do for normal sass files?)
- maybe handle color values somehow (all values are put in sass as quoted
  strings; converting from a string to a color from sass is impossible; people
  might want to be able to import a color value from sass and then modify it
  using `color.scale()` or whatever? unsure how important this is since you can
  also just pass colors as number tuples or some other consistent value and
  manually create the color values from those numbers from sass)
