# Information for contributors

In this file you'll learn about our priorities, how to setup the dev environment and more.

## Setting up the development

Firstly, make sure you have [Node.js](https://nodejs.org/en/) and [Git](https://git-scm.com) installed. Once you do, you should clone the repo by running

```bash
git clone https://github.com/Eugleo/magic-racket.git
```

Then you can install all the things you'll need simply by running

```bash
npm install
```

### Code style

The style and quality of the code is being checked automatically by GitHub actions set up on this repo. But don't worry — appropriate ESLint rules are set up automatically by the install script above, so you don't have to do anything besides making sure ESLint doesn't report any errors in your code.

## Development priorities

The most important task is to get as many features as possible added to [racket-langserver](https://github.com/jeapostrophe/racket-langserver). If you want to help Magic Racket as effectively as possible **help @jeapostrophe with racket-langserver**. Not to mention that this will by extension also help the developers of Racket extensions for other editors

Better hover information? Formatting? Autocomplete? Semantic highlighting? These things, and many more, can be only accomplished through [racket-langserver](https://github.com/jeapostrophe/racket-langserver).

If you for some reason want to work on Magic Racket directly, we could use some help with refactoring the big regexp file with syntax highlighting — it's messy, buggy, and not easily extensible. It won't be an easy task, and neither it will have the biggest effect (for that, help develop the [racket-langserver](https://github.com/jeapostrophe/racket-langserver)), but it will be useful in the long run. There's an issue with more information on the repo.
