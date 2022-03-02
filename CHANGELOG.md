# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.6.4 (2nd March 2022)
- Updated dependencies
- Hopefully finally packaged the correct code

## 0.6.3 (26th January 2022)
- Fixed: A packaging issue that caused the previous version not to fix anything
- Fixed: A weird behaviour in Powershell (thanks, @CatEricka)

## 0.6.2 (13th January 2022)

- Fixed: Incorrect quoting of racket paths on Windows (thanks, @shocoman)
- Fixed: Incorrect folding of code (thanks, @shocoman)
- Fixed: Errortrace causing the REPL to be unuseable

## 0.6.1 (26th December 2021)

- Fixed: Escape sequences now work in regexp bytestrings as well

## 0.6.0 (26th December 2021)

- It is now possible to configure the command used for launching the language server and also the arguments that are passed into it. This should make the workarounds in WSL and Docker easier.
- It is now possible to configure the arguments that are passed to `racket` during REPL creation
- Improved quoting of command-line arguments, fixing many little bugs
- Settings have been renamed and reorganised for greater clarity

## 0.5.8 (1st September 2021)

- Added two separate settings for Racket path, one used for the LSP, other of the REPL
- Fixed potential vurneabilities by updating npm packages

## 0.5.7 (20th January 2021)

- Added an option to disable the LSP integration

## 0.5.6 (5th May 2020)

- Fixed issues for cmd.exe Windows users
- Fixed the URI encoding issue that prevented the LSP working on Windows

## 0.5.5 (4th May 2020)

### Changed
- Replaced the custom LSP fork with the official version, which can be installed simply by running `raco pkg install racket-langserver`. This prevents the headaches of managing a custom forked LSP.

### Fixed
- Launching the LSP now correctly uses the value of `magic-racket.general.racketPath`.

## 0.5.4 (2nd May 2020)

- Minor changes to the marketplace page of Magic Racket.

## 0.5.3 (2nd May 2020)

- Fixed the infinite loop caused by opening an empty file.

## 0.5.2 (1st May 2020)

- Add the trace setting to help debug the LSP.

## 0.5.1 (1st May 2020)

- Minor changes to README and the marketplace page of Magic Racket.

## 0.5.0 (1st May 2020)

### Added

- LSP support! Now you can go to definition, see a list of defined symbols and more. See the README for the complete list of LSP features.
- Tweaks to how brackets are autocompleted, leading to better writing experience.
- You can now customize the "Run in terminal" behaviour.

### Changed

- Ditched the old unintuitive REPL workflow for a new `one file = one repl` one. No more REPL headaches!

## 0.4.5 (29th October 2019)

- It is now possible to open a REPL without needing to have a file open first.
- Changes to how REPL handling works (see the README for in-depth description).
- You can now type the lambda symbol by using the new snippet `lmb` or via a shortcut.

## 0.4.2, 0.4.3, 0.4.4 (24th October 2019)

- Minor changes to README and the marketplace page of Magic Racket.

## 0.4.1 (24th October 2019)

- Update word separators, so that `enter!` is taken as a one word.

## 0.4.0 (24th October 2019)

- You can now load the current file into a Racket REPL.
- You can now run the whole file in a terminal.
- You can execute selection in the REPL.

## 0.3.3 (6th March 2019)

- Fixed the highlighting of `#\(`.
- Fixed the highlighting of some other weird characters, which were previously not recognized as characters at all.

## 0.3.2 (1st March 2019)

- Added a new scope for invalid escape characters in string sequences.
  - A valid escape sequence is, for example, `\n`, while `\O` is an invalid one—it triggers a runtime error. The second one will now be colored red in supported themes (most themes, actually), to help prevent these stupid errors.

## 0.3.1 (20th February 2019)

- Fixed the highlighting of `,symbol` and `,@symbol`.

## 0.3.0 (1st February 2019)

### Changed

- The first symbol in list is no longer scoped as a function.
  - This fixes numerous inconsistencies (such as in let-bindings) and makes the behavior closer to that of DrRacket.
- Functions exported from `racket` are now highlighted wherever they appear, even in the middle of a list.
- Quoted symbols are scoped as single-quoted strings.

### Fixed

- The behavior of quotes is now consistent.

## 0.2.1 (31th January 2019)

- Fixed handling of here strings.
- Fixed the here string terminating sequence.

## 0.2.0 (31th January 2019)

- Improved support for all numbers.
- Parts of invalid numbers are no longer being highlighted as valid.
- Fixed handling of some edge cases of valid numbers, such as `#e#x+e#s+e@-e#l-e` (yep, that's apparently a number).
- Fixed handling of complex numbers, such as `+i` or `1@-inf.0`.

From now on, if your number isn't getting highlighted, it's most likely due to it being wrong, and it probably won't be accepted by the racket reader.

## 0.1.1 (30th January 2019)

- Minor changes. Bigger comming up.

## 0.1.0 (30th January 2019)

- The very first release. Everything has changed!
