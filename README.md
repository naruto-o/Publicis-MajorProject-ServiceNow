# Major Project — Node.js Conversion

This package contains a Node.js + Express setup for your existing HTML project.
All `.html` files were converted to EJS templates in `/views`. A reusable
**Back to Home** button is included via `views/partials/back-button.ejs` and
is injected on all pages **except `home.ejs`**.

## Run Locally
```bash
npm install
npm run start
```
The server will start at http://localhost:3000

## Notes
- Static files are served from `/public`.
- Basic GET routes were created for each original HTML page.
- Link references like `href="page.html"` were rewritten to `href="/page"`.
- Add your own CSS to `public/css/style.css` or keep your existing styles if they are inline.
- Stub POST routes are included for `/add-item`, `/login`, and `/signup`.
