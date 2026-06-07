# Change Log

All notable changes to the "Semantic AI Commit" extension will be documented in this file.

## v0.3.0 - 07/06/2026

- Added support for Gemma 4 models.
- Excluded binary files from staged diff analysis.
- Renamed specific AI references to generic AI for better abstraction.
- Converted webpack configuration to ESM.
- Added project documentation and development guides.
- Integrated Prettier with ESLint and VS Code for consistent code formatting.
- Improved VS Code tasks and problem matchers.

## v0.2.2 - 24/04/2026

- Added structured schema for commit message generation via AI API.
- Improved prompt for commit messages, now loaded from an external Markdown file.
- Ignored irrelevant files (e.g. lock files) from the staged diff analysis.
- Centralized all user-facing interface messages into a constants module.

## v0.2.1 - 09/03/2026

- Fix for AI settings when using models other than version 3.

## v0.2.0 - 27/02/2026

- Added support for selecting the AI model in the settings.
- Added tests for exported utility functions.
- Updated dependencies.

## v0.1.2 - 06/01/2026

- Added unit tests for extension commands and functionalities.

## v0.1.1 - 06/01/2026

- Added GitHub Actions workflow for publishing the extension.

## v0.1.0 - 05/01/2026

- Enhanced selection for multiple open repositories.
- Added support for the commit message language.

## v0.0.3 - 23/09/2025

- Added demo GIFs for SCM menu and Command Palette in the README.

## v0.0.2 - 22/09/2025

- Improvements in documentation.

## v0.0.1 - 22/09/2025

- Initial release: automatic generation of commit messages with AI.
