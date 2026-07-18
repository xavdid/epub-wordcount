set quiet
set no-exit-message

export PATH := `pwd` + "/node_modules/.bin:" + env('PATH')

_default:
    just --list --unsorted

# ⭐ run unit tests
[positional-arguments]
test *args: build
    vitest --run "$@"


# ⭐ run style checks, fixing issues if possible
lint: (lint-check "--fix")

# run style checks without changing anything
lint-check *args: install
    eslint . {{ args }}

_prettier mode:install
    prettier --log-level warn --{{ mode }} src __tests__

format: (_prettier "write")

format-check: (_prettier "check")

# reinstall dependencies, if needed
install:
    yarn {{ if is_dependency() == "true" { "--silent" } else { "" } }}

build: install
    tsc

[positional-arguments]
run *args: build
    node lib/cli.js "$@"

release: validate
    npx np --no-release-draft

validate: test lint-check format-check
