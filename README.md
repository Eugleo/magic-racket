# Magic Racket for VSCode

This extension adds support for [Racket](http://www.racket-lang.org) syntax highlighting. There are already many packages that try to accomplish the same, but this one aims to:

- have nearly complete support for every valid Racket syntax, including byte strings, quotes and define clauses
- have the `#lang racket` built-in functions fully implemented
- don't get in way (no useless snippets, no colorization just for the sake of it)
- be easily convertible to other formats, which means eventually I'll be able to port this package to other editors as well

This package is being worked on; the first two points from the abovementioned three are already here, however. You can checkout the differences between Magic Racket and other packages in the next section.

## Magic Racket vs other packages

_The theme used in the screenshots is Atom One Dark. The code samples are just my gibberish._

I've built a simple file showcasing various types of valid Racket syntax. The next image shows a comparison of the file highlighted using a popular Racket VSCode extension (left side) and the same file highlighted by Magic Racket.

![Bad highlighting](images/magic-vs-other.png)

The highlighting is not only *more colorful*, it strives to be _correct_ and *consistent*. In many ways, this extension was inspired by the highlighting in DrRacket itself, however, in some aspects it aims to be less minimalistic.

If something isn't highlighted correctly, it's probably because it isn't valid syntax. In particular, if your number isn't getting highlighted, it's most likely due to it being wrong, and it won't be accepted by the Racket reader either. 

*Nonetheless, if you think you found a bug, please open an issue — see Contributing.*

## Todo

This is a list of this which are not yet implemented/don't work as well as they should. It's mostly some weird syntax which I've never seen in the wild:

- [x] sexp comments: `;#[...]` (partial support done, and it's the best I can do with regexes)
- [x] boxes: `#&` (partial support, same as with sexp comments)
- [ ] graphs (AFAIK nobody uses this anyway)
- [ ] structs with weird names: `this| is name of the struct|`

## Contributing

If you'd like to implement this in another editor, especially an editor like Atom, please contact me. We can join forces, work the grammar I've already built, and then package it for Atom.

If you find any issues with the highlighting, please [open an issue](https://github.com/Eugleo/magic-racket/issues) or better, submit a pull request. 

If you have any feature requests or other ideas, please open an issue as well. I hope to make this package a complete Racket experience someday, so don't be afraid to discuss any ideas you have. If you know something about how indentation works in VSCode — please contact me. I could use a little help with this one.