# Changelog

## [0.1.0] - 2025-11-24

### Fixed
- **Build System**: Fixed `package.json` scripts and dependencies. Removed `rolldown-vite` and switched to standard `vite`. Added `engines` field.
- **API Layer**: Refactored `src/services/api.js` into modular `src/api` directory (`client.js`, `emissions.js`, `ai.js`).
- **AddEmission Form**: 
  - Implemented bulk submission logic using `/emissions/bulk`.
  - Added `calculateEmission` utility for arithmetic exactness.
  - Fixed business ID handling (auto-generation and storage).
- **Dashboard**: 
  - Updated to use new API wrappers.
  - Fixed report download to use `POST` endpoint with blob response.
- **Forecast**: Updated to use `POST` endpoint with JSON payload.
- **Upload**: Updated to use `uploadCSV` wrapper.
- **Leaderboard**: Updated to fetch real data from `/leaderboard`.
- **AI Features**: Updated `AiCalculator` and `Insights` to use new API wrappers.

### Added
- **Tests**: Added unit tests for `calculateScore` utility.
- **Configuration**: Added `.env.example`, `.ag-ignore`, `jsconfig.json`.
- **Utils**: Created `src/utils/calculateScore.js`.

### Removed
- **Legacy Code**: Removed `src/services/api.js`.
