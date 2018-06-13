#!/usr/bin/env bash

if [[ -z "$TRAVIS_TAG" ]]; then exit; fi

npm run dist:sync
