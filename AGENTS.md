# AI Agents / Assistants

## Preferred Stack
- **Framework:** Astro (Static Site Generation for GitHub Pages)
- **Styling:** SCSS (Sass)
- **Components:** Web Components built with JSX using [texsaur](https://github.com/ConnorJamesLow/texsaur)
- **Language:** TypeScript

## Guidelines
- Write static markup inside Astro components (`.astro`) unless interactivity is required.
- Isolate interactive logic into custom web components in `.tsx` files utilizing `texsaur` for JSX templating.
- Ensure Vite is correctly using the `texsaur` JSX factory when compiling `.tsx` elements via `.astro` `<script>` tags.
- Compile to standard static HTML/CSS/JS for GitHub pages. 
- Use SCSS for styling, avoiding Tailwind unless specified.
