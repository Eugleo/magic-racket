# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] 24th October 2019

- Update word separators, so that `enter!` is taken as a one word.

## [0.4.0] 24th October 2019

- You can now load the current file into a Racket REPL.
- You can now run the whole file in a terminal.
- You can execute selection in the REPL.

## [0.3.3] 6th March 2019

- Fixed the highlighting of `#\(`.
- Fixed the highlighting of some other weird characters, which were previously not recognized as characters at all.

## [0.3.2] 1st March 2019

- Added a new scope for invalid escape characters in string sequences.
  - A valid escape sequence is, for example, `\n`, while `\O` is an invalid one—it triggers a runtime error. The second one will now be colored red in supported themes (most themes, actually), to help prevent these stupid errors.

## [0.3.1] 20th February 2019

- Fixed the highlighting of `,symbol` and `,@symbol`.

## [0.3.0] 1st February 2019

### Changed

- The first symbol in list is no longer scoped as a function.
  - This fixes numerous inconsistencies (such as in let-bindings) and makes the behavior closer to that of DrRacket.
- Functions exported from `racket` are now highlighted wherever they appear, even in the middle of a list.
- Quoted symbols are scoped as single-quoted strings.

### Fixed

- The behavior of quotes is now consistent.

## [0.2.1] 31th January 2019

- Fixed handling of here strings.
- Fixed the here string terminating sequence.

## [0.2.0] 31th January 2019

- Improved support for all numbers.
- Parts of invalid numbers are no longer being highlighted as valid.
- Fixed handling of some edge cases of valid numbers, such as `#e#x+e#s+e@-e#l-e` (yep, that's apparently a number).
- Fixed handling of complex numbers, such as `+i` or `1@-inf.0`.

From now on, if your number isn't getting highlighted, it's most likely due to it being wrong, and it probably won't be accepted by the racket reader.

## [0.1.1] 30th January 2019

- Minor changes. Bigger comming up.

## [0.1.0] 30th January 2019

- The very first release. Everything has changed!
