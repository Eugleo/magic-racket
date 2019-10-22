# Magic Racket for VSCode

This extension adds support for [Racket](http://www.racket-lang.org) syntax highlighting and REPL.

## Features

This package aims to:

- Have nearly complete support for every valid Racket syntax, including byte strings, quotes and define clauses.
- Have the `#lang racket` built-in functions fully implemented and highlighted.

...but at the same time:

- Don't get in the way (no useless snippets, no colorization just for the sake of it).
- Be easily convertible to other formats.

Eventually, I'd like to be able to include support for Racket LSP as well — in the meantime, you can at least comfortably use the REPL with Magic Racket.

### Syntax highlighting

_The theme used in the screenshots is Atom One Dark. The code samples are just my gibberish._

I've built a simple file showcasing various types of valid Racket syntax. The image shows a comparison of the testing file highlighted using a popular Racket VS Code extension (left side) and the same file highlighted by Magic Racket (right side).

![Bad highlighting](images/magic-vs-other.png)

As you can see, the highlighting strives to be _correct_ and _consistent_ — and it supports most of the language's features as well. In many ways, this extension was inspired by the highlighting in DrRacket itself, however, in some aspects it aims to be less minimalistic.

If something isn't highlighted correctly, it's probably because it isn't valid syntax. In particular, if your number isn't getting highlighted, it's most likely due to it being wrong, and it won't be accepted by the Racket reader either.

*Nonetheless, if you think you found a bug, please open an issue — see Contributing.*

### REPL support

There are four new commands in VS Code, which you can find upon pressing <kbd>`Cmd+Shift+P`</kbd> (or <kbd>`Ctrl+Shift+P`</kbd> if you're on Linux or Windows):

- Racket: Execute selection in REPL (shortcut <kbd>Alt+Enter</kbd>)
- Racket: Load file into REPL (shortcut <kbd>Cmd+Shift+R</kbd>, or <kbd>Ctrl+Shift+R</kbd> on Windows and Linux)
- Racket: Run file in terminal
- Racket: Focus on current REPL

When you load the file into the REPL, all of the bindings of that file will be made available (the Racket function `enter!` is used). However, if you'd try to load another file into the *same* REPL, the bindings from the previous file would become lost. That's why in Magic Racket, every file will be loaded in its own Racket REPL. You can execute the command `Racket: Focus on current REPL` to switch to the terminal with the appopriate REPL for the file you are currently editing.

There is also a setting which allows VS Code to switch between terminals automatically, so that always the right REPL is in focus.

## Contributing

If you'd like to implement this in another editor, especially an editor like Atom, please contact me. We can join forces, work the grammar I've already built, and then package it for Atom.

If you find any issues with the highlighting, please [open an issue](https://github.com/Eugleo/magic-racket/issues) or better, submit a pull request.

If you have any feature requests or other ideas, please open an issue as well. I hope to make this package a complete Racket experience someday, so don't be afraid to discuss any ideas you have. If you know something about how indentation works in VSCode — please contact me. I could use a little help with this one.