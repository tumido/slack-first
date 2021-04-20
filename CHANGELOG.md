# [1.3.0](https://github.com/tumido/slack-first/compare/v1.2.0...v1.3.0) (2021-04-20)


### Bug Fixes

* Disable URL unfurl on help messages ([fca7baf](https://github.com/tumido/slack-first/commit/fca7baf93c02d508947e93370aa33a10522ae136))


### Features

* Modal for commenting a thread to an issue ([851d28e](https://github.com/tumido/slack-first/commit/851d28e5f5592ab5afa57505c575d2e9dc661252))
* Remove Home tab base from dev preview ([a7d0476](https://github.com/tumido/slack-first/commit/a7d0476f793fb98ed4e4baed663b5de61e9d848a))
* Respond to all support channel messages, skip replies ([37e6b18](https://github.com/tumido/slack-first/commit/37e6b18b92c67aeff3897669d797f7aef841a343))
* **github:** Responses to opened issue display shortened links ([5efb739](https://github.com/tumido/slack-first/commit/5efb739fd6108e0574f37957e8b4aaad2c8d4a7e))

# [1.2.0](https://github.com/tumido/slack-first/compare/v1.1.0...v1.2.0) (2021-04-01)


### Features

* Base for the Home tab ([2a1d74f](https://github.com/tumido/slack-first/commit/2a1d74f08b339dd13b4dd0166fcefc0b3ec745a6))
* Use node-watch instead of a custom watcher ([50acb01](https://github.com/tumido/slack-first/commit/50acb01cd70c311c5aee6a34979bba232cc102ea))

# [1.1.0](https://github.com/tumido/slack-first/compare/v1.0.1...v1.1.0) (2021-03-24)


### Bug Fixes

* Use Prettier for TypeScript ([5ba8577](https://github.com/tumido/slack-first/commit/5ba85776c923c0c12bf773845e3544055b923662))


### Features

* Add deployment manifests ([6e03564](https://github.com/tumido/slack-first/commit/6e035649aee6b25a5a3fdb7115dcba722abcbbc9))
* Add healthz endpoint ([c59503e](https://github.com/tumido/slack-first/commit/c59503e3c99cfce5767572bd4693c35b9d9a90bb))
* Enable schedulling for on-call duty ([4a00359](https://github.com/tumido/slack-first/commit/4a003590298901b3ae2081897cfa812d784fc663))
* Load github repositories externally - on modal input ([3752409](https://github.com/tumido/slack-first/commit/37524092646d6009367916a04c713895d2055509))
* Polish the introduction experience ([965fd00](https://github.com/tumido/slack-first/commit/965fd00094b07c3cdb2c6277ff3927d70f2c3900))
* Support declarative repositories ([3e32893](https://github.com/tumido/slack-first/commit/3e32893605bd14248741e51b70e417edd7299825))

## [1.0.1](https://github.com/tumido/slack-first/compare/v1.0.0...v1.0.1) (2021-03-22)


### Bug Fixes

* A type anotation was dropping a promise ([f5c1997](https://github.com/tumido/slack-first/commit/f5c1997d1a148b03114bc751fdab23444572749e))

# 1.0.0 (2021-03-22)


### Bug Fixes

* Cleanup oncall code ([beca005](https://github.com/tumido/slack-first/commit/beca005a8a0f394b6773d9fbf2a0aa98213682f8))
* Remove globalAny ([564145e](https://github.com/tumido/slack-first/commit/564145e26b79694a8be81d3a5587c5fd53c752ea))


### Features

* Add /oncall screenshot to help ([1a699f4](https://github.com/tumido/slack-first/commit/1a699f482d244579cca921c257e0ef1d385cc55c))
* Add a basic on-call code ([2954115](https://github.com/tumido/slack-first/commit/2954115fd96720647e7d9819bd55b32de8e25a28))
* Add bot scaffold ([5b865e7](https://github.com/tumido/slack-first/commit/5b865e7aba878e773b782d19cdfcd3b890a352c9))
* Add GitHub action ([b3a4928](https://github.com/tumido/slack-first/commit/b3a4928731094292dc60fe79efd9b4aaf6c917db))
* Downgrade to Node v14 for s2i support ([5515549](https://github.com/tumido/slack-first/commit/55155499a6e4efc6ede646c8f92f48fcc3464a6e))
* Enable container build ([d5d401f](https://github.com/tumido/slack-first/commit/d5d401fb73a59a2cc892a508d1f89e521c1cf073))
* GitHub integration: Make bot reply with issue url ([e136cc9](https://github.com/tumido/slack-first/commit/e136cc97d6f20a40d08f568017e1d0c74c0e69e8))
* Improve config file watcher ([8a413da](https://github.com/tumido/slack-first/commit/8a413dafee0a1965b8334a3d7077584ae983ace1))
* Initial commit ([29060fc](https://github.com/tumido/slack-first/commit/29060fcf6a697defcaa212cfdeeb7fd23047c8a9))
* Load dotenv on dev start ([421ba11](https://github.com/tumido/slack-first/commit/421ba1127a613fb63ab9175baea5dc4e4cb8cd34))
* Make a proper introduction ([cdaf4cf](https://github.com/tumido/slack-first/commit/cdaf4cf8afef3d201773453f82ab282cf222963f))
* Make config a global middleware ([7518101](https://github.com/tumido/slack-first/commit/7518101695c2d6c7a802d45038fee5eacbb87fd2))
* README and documentation ([d1cef1f](https://github.com/tumido/slack-first/commit/d1cef1f0dbe219f065d0170405c4d0d273377f41))
* Setup TypeScript ([231b204](https://github.com/tumido/slack-first/commit/231b2046e01fc4325641ab43d4262487848194e4))
* Unify help and introduction ([edbb0e4](https://github.com/tumido/slack-first/commit/edbb0e40c40d2c8ad5c62a904899e0736d42a97f))
* Use eslint instead of tslint and fix linter issues ([2052677](https://github.com/tumido/slack-first/commit/2052677890868f36b289270793bc3d16cec3690d))
* Use shortcuts for on-call support ([a781e6b](https://github.com/tumido/slack-first/commit/a781e6bb35b7f760b3689955a0e58965bd356187))
