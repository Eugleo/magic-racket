# Magic Racket for VS Code

This extension adds support for [Racket](http://www.racket-lang.org) syntax highlighting and REPL.

## Features

This package aims to:

- Have nearly complete support for every valid Racket syntax.  Byte strings, regexps, define clauses... You name it, we have it.
- Have the `#lang racket` built-in functions fully implemented and highlighted.

...but at the same time Magic Racket doesn't want to:

- Get in your way (by providing useless snippets, or throwing around colorization just for the sake of it).
- Only work in VS Code. The code is highly portable and there are plans to port Magic Racket also to Atom and Sublime Text.

Eventually, I'd like to be able to include support for Racket LSP as well; in the meantime, you can at least comfortably use the REPL with Magic Racket.

### Syntax highlighting

The image shows a comparison of a testing file highlighted using a popular Racket VS Code extension (left side) by Magic Racket (right side).

![Bad highlighting](images/magic-vs-other.png)

As you can see, the highlighting strives to be _correct_ and _consistent_ — and it supports most of the language's features as well. In many ways, this extension was inspired by the highlighting in DrRacket itself, however, in some aspects it aims to be less minimalistic.

### REPL support

There are four new commands in VS Code, which you can find upon pressing <kbd>`Cmd+Shift+P`</kbd> (or <kbd>`Ctrl+Shift+P`</kbd> if you're on Linux or Windows):

- Racket: Execute selection in REPL (shortcut <kbd>Alt+Enter</kbd>)
- Racket: Load file into REPL (shortcut <kbd>Cmd+Shift+R</kbd>, or <kbd>Ctrl+Shift+R</kbd> on Windows and Linux)
- Racket: Run file (runs it in terminal, outside of REPL)
- Racket: Focus on REPL of the current file

![REPL showcase](images/repl.gif)

There are also buttons which run `Racket: Execute selection in REPL` and `Racket: Load file into REPL` for you convenience.

When you load the file into the REPL, all of the bindings of that file will be made available (the Racket function `enter!` is used). However, if you'd try to load another file into the *same* REPL, the bindings from the previous file would become lost. That's why in Magic Racket, every file will be loaded in its own Racket REPL. You can execute the command `Racket: Focus on REPL of the current file` to switch to the terminal with the appopriate REPL for the file you are currently editing.

There is also a setting which allows VS Code to switch between terminals automatically, so that always the right REPL is in focus for the current file.

## Extension Settings

This extesion provides two settings:
- `magic-racket.focusCurrentRepl` (beta) determines whether the terminals should be automatically switched so that the terminal with REPL for the current file is always shown.
- `magic-racket.racketPath` is the path to the Racket executable.

## Release Notes

Please see the [changelog](CHANGELOG.md) for the information about the latest updates.