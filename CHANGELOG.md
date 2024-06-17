# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.1](https://github.com/fp-toolkit/fp-toolkit/compare/v2.0.0...v2.0.1) (2024-06-17)

## [2.0.0](https://github.com/fp-toolkit/fp-toolkit/compare/v1.6.1...v2.0.0) (2024-06-05)


### ⚠ BREAKING CHANGES

* **Rec:** make Rec type Partial to achieve Map-consistent semantics

### Bug Fixes

* **ArraySet:** export the ArraySet module :facepalm: ([0bf8c69](https://github.com/fp-toolkit/fp-toolkit/commit/0bf8c69b6c66c88cc958a6c1ddfbda534d1bc6fa))
* **Rec:** make Rec type Partial to achieve Map-consistent semantics ([68cc233](https://github.com/fp-toolkit/fp-toolkit/commit/68cc233d6bbfd03ba1a985c484965ee07079d4e1))

### [1.6.1](https://github.com/fp-toolkit/fp-toolkit/compare/v1.6.0...v1.6.1) (2024-06-05)

## [1.6.0](https://github.com/fp-toolkit/fp-toolkit/compare/v1.5.0...v1.6.0) (2024-06-04)


### Features

* implement ArraySet module and tests ([5b6daad](https://github.com/fp-toolkit/fp-toolkit/commit/5b6daad0bdc1f156041e9477b65516f32c05b8b4))
* **Map:** better type inference when pipelining ([215167c](https://github.com/fp-toolkit/fp-toolkit/commit/215167c9c6d9aba85edf949f94f509fd071817d2))
* **Rec:** implement record `Rec<>` module + tests ([429da80](https://github.com/fp-toolkit/fp-toolkit/commit/429da80223db63c82fb6711e496be6f06a5118c5))

## [1.5.0](https://github.com/fp-toolkit/fp-toolkit/compare/v1.4.3...v1.5.0) (2024-05-16)


### Features

* **deferred/deferredresult:** add deferred.map, deferredresult.map, and deferredresult.mapErr ([#66](https://github.com/fp-toolkit/fp-toolkit/issues/66)) ([ea65404](https://github.com/fp-toolkit/fp-toolkit/commit/ea6540458a49e2d6343f8c8d19641d7fa106bc7f))

### [1.4.3](https://github.com/fp-toolkit/fp-toolkit/compare/v1.4.2...v1.4.3) (2024-05-14)


### Bug Fixes

* **array:** allow groupBy to pass through key types that extend string ([#65](https://github.com/fp-toolkit/fp-toolkit/issues/65)) ([b23a3e9](https://github.com/fp-toolkit/fp-toolkit/commit/b23a3e9c1f2e1e1ba48d52ff342f55ea3c307f61))

### [1.4.2](https://github.com/fp-toolkit/fp-toolkit/compare/v1.4.1...v1.4.2) (2024-04-26)


### Bug Fixes

* **biome:** disable always preferring types over interfaces in biome ([1e88911](https://github.com/fp-toolkit/fp-toolkit/commit/1e889111433a3e383e1ca8b19ef0560850842a95))

### [1.4.1](https://github.com/fp-toolkit/fp-toolkit/compare/v1.4.0...v1.4.1) (2024-04-26)


### Bug Fixes

* **build:** biome, ignore package.json formatting plz ([ef16012](https://github.com/fp-toolkit/fp-toolkit/commit/ef160129e5badea2e6a8b49802667b86238c88f6))

## [1.4.0](https://github.com/fp-toolkit/fp-toolkit/compare/v1.3.2...v1.4.0) (2024-04-26)


### Features

* publish correct bundles and types for cjs, mjs, ts consumption ([bc6da19](https://github.com/fp-toolkit/fp-toolkit/commit/bc6da19034ae01cc7d6e119089828fe19dcc411e))

### [1.3.2](https://github.com/fp-toolkit/fp-toolkit/compare/v1.3.1...v1.3.2) (2023-11-27)

### [1.3.1](https://github.com/fp-toolkit/fp-toolkit/compare/v1.3.0...v1.3.1) (2023-08-28)

## [1.3.0](https://github.com/fp-toolkit/fp-toolkit/compare/v1.2.3...v1.3.0) (2023-03-30)


### Features

* **AsyncResult:** add tee and teeErr fns ([3309d63](https://github.com/fp-toolkit/fp-toolkit/commit/3309d635eecb5b4b8d84e4114a1adcf8276c950d))

### [1.2.3](https://github.com/fp-toolkit/fp-toolkit/compare/v1.2.2...v1.2.3) (2023-03-28)

### [1.2.2](https://github.com/fp-toolkit/fp-toolkit/compare/v1.2.1...v1.2.2) (2023-03-28)

### [1.2.1](https://github.com/fp-toolkit/fp-toolkit/compare/v1.2.0...v1.2.1) (2023-03-24)

### Bug Fixes

-   **docs site:** async and result modules docs ([ed7ae47](https://github.com/fp-toolkit/fp-toolkit/commit/ed7ae478e6e1eb2e7150b3ba134a0b16c0c02cd4))

## [1.2.0](https://github.com/fp-toolkit/fp-toolkit/compare/v1.1.3...v1.2.0) (2023-03-24)

### Features

-   support typedoc docs site ([aa10a74](https://github.com/fp-toolkit/fp-toolkit/commit/aa10a74666461dea55394e39b050c85d8710921b))

### [1.1.3](https://github.com/fp-toolkit/fp-toolkit/compare/v1.1.2...v1.1.3) (2023-03-24)

### [1.1.2](https://github.com/fp-toolkit/fp-toolkit/compare/v1.1.1...v1.1.2) (2023-03-24)

### [1.1.1](https://github.com/fp-toolkit/fp-toolkit/compare/v1.1.0...v1.1.1) (2023-03-23)

## [1.1.0](https://github.com/fp-toolkit/fp-toolkit/compare/v1.0.2...v1.1.0) (2023-03-23)

### Features

-   Implement DeferredResult ([#34](https://github.com/fp-toolkit/fp-toolkit/issues/34)) ([55d94c1](https://github.com/fp-toolkit/fp-toolkit/commit/55d94c1c888267b8dc26fb25aad778434724fd09))

### [1.0.2](https://github.com/fp-toolkit/fp-toolkit/compare/v1.0.1...v1.0.2) (2023-03-22)

### 1.0.1 (2023-03-19)

## 1.0.0 (2023-03-19)
