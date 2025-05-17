# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.7.0 (2025-05-17)

### Added

- Rhombus syntax highlighting and comment toggling (@TimWhiting)
- Rhombus line length (@jryans)

## 0.6.7 (2024-05-29)

### Added

- Extension now activates for all documents using the Racket language (even
  those without files, such as unsaved buffers) (@jryans)
- Extension icon now also used as the Racket language icon (@samestep)

### Fixed

- Character constants (e.g. `#\(`) are now marked as strings and no longer
  confuse parenthesis matching (@xiaoyu2006)
- Character constants list updated to include `#\tab` (@jryans)

## 0.6.6 (2023-07-10)

### Added

- Additional troubleshooting steps added to README (@jryans)
- Extension environment info logged to new Racket output channel (@jryans)

### Fixed

- PowerShell version detection used to select correct command quoting
  (@vagreargnatry)
- Removed redundant build paths, using `esbuild` going forward (@jryans)
- Fixed language server trace setting (useful for debugging) (@jryans)

## 0.6.5 (2023-03-11)

### Added
- When nothing is selected, send to REPL sends the current line (@suhr)

### Fixed
- Sending code to REPL no longer changes focus away from editor (@suhr)
- Fixed various comment syntax highlighting cases (@jryans)
- Updated dependencies

## 0.6.4 (2022-03-02)
- Updated dependencies
- Hopefully finally packaged the correct code

## 0.6.3 (2022-01-26)
- Fixed: A packaging issue that caused the previous version not to fix anything
- Fixed: A weird behaviour in Powershell (thanks, @CatEricka)

## 0.6.2 (2022-01-13)

- Fixed: Incorrect quoting of racket paths on Windows (thanks, @shocoman)
- Fixed: Incorrect folding of code (thanks, @shocoman)
- Fixed: Errortrace causing the REPL to be unusable

## 0.6.1 (2021-12-26)

- Fixed: Escape sequences now work in regexp bytestrings as well

## 0.6.0 (2021-12-26)

- It is now possible to configure the command used for launching the language server and also the arguments that are passed into it. This should make the workarounds in WSL and Docker easier.
- It is now possible to configure the arguments that are passed to `racket` during REPL creation
- Improved quoting of command-line arguments, fixing many little bugs
- Settings have been renamed and reorganised for greater clarity

## 0.5.8 (2021-09-01)

- Added two separate settings for Racket path, one used for the LSP, other of the REPL
- Fixed potential vulnerabilities by updating npm packages

## 0.5.7 (2021-01-20)

- Added an option to disable the LSP integration

## 0.5.6 (2020-05-05)

- Fixed issues for cmd.exe Windows users
- Fixed the URI encoding issue that prevented the LSP working on Windows

## 0.5.5 (2020-05-04)

### Changed
- Replaced the custom LSP fork with the official version, which can be installed simply by running `raco pkg install racket-langserver`. This prevents the headaches of managing a custom forked LSP.

### Fixed
- Launching the LSP now correctly uses the value of `magic-racket.general.racketPath`.

## 0.5.4 (2020-05-02)

- Minor changes to the marketplace page of Magic Racket.

## 0.5.3 (2020-05-02)

- Fixed the infinite loop caused by opening an empty file.

## 0.5.2 (2020-05-01)

- Add the trace setting to help debug the LSP.

## 0.5.1 (2020-05-01)

- Minor changes to README and the marketplace page of Magic Racket.

## 0.5.0 (2020-05-01)

### Added

- LSP support! Now you can go to definition, see a list of defined symbols and more. See the README for the complete list of LSP features.
- Tweaks to how brackets are autocompleted, leading to better writing experience.
- You can now customize the "Run in terminal" behaviour.

### Changed

- Ditched the old unintuitive REPL workflow for a new `one file = one repl` one. No more REPL headaches!

## 0.4.5 (2019-10-29)

- It is now possible to open a REPL without needing to have a file open first.
- Changes to how REPL handling works (see the README for in-depth description).
- You can now type the lambda symbol by using the new snippet `lmb` or via a shortcut.

## 0.4.2, 0.4.3, 0.4.4 (2019-10-24)

- Minor changes to README and the marketplace page of Magic Racket.

## 0.4.1 (2019-10-24)

- Update word separators, so that `enter!` is taken as a one word.

## 0.4.0 (2019-10-24)

- You can now load the current file into a Racket REPL.
- You can now run the whole file in a terminal.
- You can execute selection in the REPL.

## 0.3.3 (2019-03-06)

- Fixed the highlighting of `#\(`.
- Fixed the highlighting of some other weird characters, which were previously not recognized as characters at all.

## 0.3.2 (2019-03-01)

- Added a new scope for invalid escape characters in string sequences.
  - A valid escape sequence is, for example, `\n`, while `\O` is an invalid one—it triggers a runtime error. The second one will now be colored red in supported themes (most themes, actually), to help prevent these stupid errors.

## 0.3.1 (2019-02-20)

- Fixed the highlighting of `,symbol` and `,@symbol`.

## 0.3.0 (2019-02-01)

### Changed

- The first symbol in list is no longer scoped as a function.
  - This fixes numerous inconsistencies (such as in let-bindings) and makes the behavior closer to that of DrRacket.
- Functions exported from `racket` are now highlighted wherever they appear, even in the middle of a list.
- Quoted symbols are scoped as single-quoted strings.

### Fixed

- The behavior of quotes is now consistent.

## 0.2.1 (2019-01-31)

- Fixed handling of here strings.
- Fixed the here string terminating sequence.

## 0.2.0 (2019-01-31)

- Improved support for all numbers.
- Parts of invalid numbers are no longer being highlighted as valid.
- Fixed handling of some edge cases of valid numbers, such as `#e#x+e#s+e@-e#l-e` (yep, that's apparently a number).
- Fixed handling of complex numbers, such as `+i` or `1@-inf.0`.

From now on, if your number isn't getting highlighted, it's most likely due to it being wrong, and it probably won't be accepted by the racket reader.

## 0.1.1 (2019-01-30)

- Minor changes. Bigger coming up.

## 0.1.0 (2019-01-30)

- The very first release. Everything has changed!
