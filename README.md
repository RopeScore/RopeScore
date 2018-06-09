# RopeScore
[![Build Status](https://travis-ci.com/svbeon/RopeScore.svg?token=1s4TY9oCWeYFsQ1xi8ci&branch=master)](https://travis-ci.com/svbeon/RopeScore)
[![Build status](https://ci.appveyor.com/api/projects/status/cc805ye4rsim9kc7?svg=true)](https://ci.appveyor.com/project/svbeon/ropescore)


A scoring system for rope skipping based on the [FISAC-IRSF](https://fisac-irsf.org) rules, built with configurability in mind. The order of judges, names of events and to some extent what judges exist can be asily configured, as well as a "simplified" ruleset that can be easily added. the configurability is always a work in progress and does need some additional work.

A long-term goal would be to transfer the program to more modern technology than angularjs.

## Design goals

  - The program must be able to run offline
  - The program should be highly configurable
    - A simplified ruleset should be supported
    - Custom events should be supported
  - The program should be able to run either as an electron app, or as a standalone website
