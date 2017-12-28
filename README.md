# RopeScore

A scoring system for rope skipping based on the [FISAC-IRSF](https://fisac-irsf.org) rules, built with configurability in mind. The order of judges, names of events and to some extent what judges exist can be asily configured, as well as a "simplified" ruleset that can be easily added. the configurability is always a work in progress and does need some additional work.

A long-term goal would be to transfer the program to more modern technology than angularjs.

## Design goals

  - The program must be able to run offline
  - The program should be highly configurable
    - A simplified ruleset should be supported
    - Custom events should be supported
  - The program should be able to run either as an electron app, or as a standalone website (replace websockets with [lsbridge](https://github.com/krasimir/lsbridge)?)
