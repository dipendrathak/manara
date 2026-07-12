- [x] Remove dummy Mayor/Deputy/other official hardcoded cards from officials.html (page should rely only on /api/officials)

- [x] Remove dummy static sections from index.html: hero slides, notices, procedures/docs, gallery, and any placeholder representative content

- [x] Add SQLite table for hero/sliding images in init-sqlite.js
- [x] Add GET /api/slides endpoint in server.js
- [x] Update index.html to fetch slides from /api/slides and render slider dynamically; hide slider if empty
- [x] Verify: run server and ensure with empty DB there is no elected member info or dummy images shown

