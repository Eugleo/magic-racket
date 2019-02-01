## 0.1.0 - 30th January, 2019

The very first release. Everything has changed!

## 0.1.1 - 30th January, 2019

Minor changes. Bigger comming up.

## 0.2.0 - 31th January, 2019

Improved support for all numbers. Parts of invalid numbers are no longer being highlighted as valid. Fixed handling of some edge cases of valid numbers, such as `#e#x+e#s+e@-e#l-e` (yep, that's apparently a number). Fixed handling of complex numbers, such as `+i` or `1@-inf.0`.

From now on, if your number isn't getting highlighted, it's most likely due to it being wrong, and it probably won't be accepted by the racket reader.

## 0.2.1 - 31th January, 2019

Fixed handling of here strings, which were previously incorrectly delimited by `<<#` instead of `#<<`. Also fixed the here string terminating sequence.

## 0.3.0 - 1st February, 2019

The first symbol in list is no longer scoped as a function. This fixes numerous inconsistencies (such as in let-bindings) and makes the behavior closer to that of DrRacket. On the other hand, functions exported from `racket` are now highlighted wherever they appear, even in the middle of a list.

The behavior of quotes is now consistent. Quoted symbols are scoped as single-quoted strings.