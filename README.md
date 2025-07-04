# Base44 Site Template

## What?

[base44](https://base44.com/) creates really beautiful sites, which is a lifesaver for someone like me who can’t design. This is how you can make them run locally!

## How?

Make this site run:

- `npm install`
- `npm start` to check

Make your site run:

- Copy the jsx files from base44 into your directory (you can see them in base44 under Workspace > Code)
- Fix imports between the files, if you didn't keep the original file structure
- Add any missing npm packages (in your jsx files but not in template)
- Install any missing shadcn components — e.g. `npx shadcn@latest add button input dialog`
- Remove base44 “entity access” code (or comment out, to replace with in-memory key-value storage later)

That's it!


## Usage instructions

- `npm start` — This will spawn a development server with a default port of `5173`.
- `npm run build` — This will output a production build in the `dist` directory.
- `npm run preview` — This will run the production build locally with a default port of `5173` (this will not work if you haven't generated the production build yet).

## Custom port

You can use the `-p` flag to specify a port for development. To do this, you can either run `npm start` with an additional flag:

```
npm start -- --port 3000
```

Or edit the `start` script directly:

```
vite --port 3000
```
