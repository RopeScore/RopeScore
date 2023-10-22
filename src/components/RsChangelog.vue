<template>
  <h2>v6.1.2</h2>
  <ul>
    <li>
      Fix an issue where SvGF Rikshoppet Overalls were using SvGF Pair overall
      rules
    </li>
    <li>Fix the name of SvGF Rikshoppet 8:an overall</li>
  </ul>
  <h2>v6.1.1</h2>
  <ul>
    <li>Fix Wheel Required Elements missing interactions</li>
    <li>
      Fix an issue where the interface didn't update when you switched category
      from the side menu while on a category overview
    </li>
    <li>
      Hide excluded scoresheets from the score all for a competition event
    </li>
  </ul>
  <h2>v6.1.0</h2>
  <ul>
    <li>
      The options for a result page no longer obstructs the page on sufficiently
      large screens
    </li>
  </ul>
  <h2>v6.0.0</h2>
  <ul>
    <li>
      Results have moved to the cloud! This means you now have the option to
      store and see historic versions of the results for a competition, and, by
      changing the visibility setting in the group settings you can make the
      results publicly accessible via
      <a class="text-blue-700 hover:text-blue-900 underline">https://ropescore.live</a>
    </li>
  </ul>
  <h2>v5.6.0</h2>
  <ul>
    <li>
      Display what program (ropescore core/ropescore app/etc.) that filled a
      scoresheet last and what version of that program was used
    </li>
    <li>Some fixes for SvGF speed preview tables in entries</li>
    <li>Quick next/previous heat buttons on the heats page</li>
    <li>
      Sort judges in entry cards in heat view first by judge type then by name
    </li>
    <li>
      Fixes for issue where some forms couldn't be submitted by pressing enter
    </li>
    <li>
      You can now mark a scoresheet as excluded, which will exclude it from all
      result calculations. Result calculations will now always use the latest
      non-excluded scoresheet.
    </li>
  </ul>
  <h2>v5.5.2</h2>
  <ul>
    <li>
      Put the whole competition event definition code in excel sheet names to
      avoid collisions
    </li>
  </ul>
  <h2>v5.5.1</h2>
  <ul>
    <li>SvGF Vikingahoppet round speed scores to whole number</li>
    <li>Show the system ID on the system page for easier sharing</li>
  </ul>
  <h2>v5.5.0</h2>
  <ul>
    <li>Add SvGF Vikingahoppet</li>
    <li>Add IJRU v3.0.0</li>
    <li>
      Fix a bug in IJRU rules where the same normalisation score would yield
      different rank.
    </li>
    <li>
      Fix a bug on MacOS where clicking the icon in the dock when there were no
      open windows wouldn't open a new window.
    </li>
  </ul>
  <h2>v5.4.0</h2>
  <ul>
    <li>
      You can now scope a judge assignment to a specific pool, particularly
      useful for speed events where you want the judges on pool 1 to only be
      able to judge the entries passing through pool 1.
    </li>
  </ul>
  <h2>v5.3.0</h2>
  <ul>
    <li>
      Keep the "category" option in the navigation menu when switching to
      "heats" from a category, for easy navigation back
    </li>
    <li>
      Add a side-menu for quick deep-links into groups and categories
    </li>
  </ul>
  <h2>v5.2.1</h2>
  <ul>
    <li>Fix a bug where it wasn't possible to add admins to a group</li>
  </ul>
  <h2>v5.2.0</h2>
  <ul>
    <li>Add SvGF Parhopp (based on ijru@2.0.0)</li>
  </ul>
  <h2>v5.1.0</h2>
  <ul>
    <li>
      Support for new way of clearing a scoresheet in the judging app, making
      sure history is kept if it needs to be retrieved.
    </li>
  </ul>
  <h2>v5.0.1</h2>
  <ul>
    <li>
      Fixed a bug where updating a tally scoresheet would remove untouched
      values.
    </li>
  </ul>
  <h2>v5.0.0</h2>
  <p>
    This update finishes what v4.0.0 started and enables all RopeScore data to
    be stored in the cloud. This, unfortunately, so far means that the option
    to run RopeScore fully offline has been removed for now. However, we hope
    to bring it back eventually as it's an important piece in our work to
    preserve rope skipping history.
  </p>
  <p>
    Apart from most things changing how they work behind the scenes, there are
    some improvements and changes that will be more noticeable
  </p>
  <ul>
    <li>
      You now assign a device to a judge, rather than to a scoresheet. This
      should make it a lot easier to swap a device for a judge.
    </li>
    <li>
      You now configure options like "this should show up as live speed scores"
      on a judge assignment level, rather than a scoresheet level. You can
      still configure it on a scoresheet level if you want to override it.
    </li>
    <li>
      If you add competition events to a category they'll now be stored in the
      same order as they're listed, rather than the order they were added in,
      making sure there's a consistent order.
    </li>
    <li>
      You can now set the current heat via the heats panel, this is used to
      automatically update the screens in the judging app, and the live
      displays (live speed clicks, currently on stage, and next up on stage are
      available now, more to come)
    </li>
    <li>
      You can now unheat an entry if you placed it in the wrong place.
      You can still update the heat order by assigning it again without
      removing it first.
    </li>
    <li>
      There are now shortcuts for Did Not Skip and editing the entry
      scoresheets on the heats view.
    </li>
    <li>
      It's once again possible to edit participants.
    </li>
    <li>
      Scoresheets are now auto-saved after 3 seconds of no data entry in that
      scoresheet.
    </li>
    <li>
      You can now have multiple admins of a group, meaning you can do all the
      work on more than one computer.
    </li>
    <li>
      Unfortunately, you can't set a logo on the printed result pages yet in
      this version.
    </li>
    <li>
      Unfortunately, data from v4 won't be migrated over to v5 at this time,
      the data will still be stored on your computer, but hidden, so it should
      be possible to migrate this at a later point.
    </li>
  </ul>
  <h2>v4.0.0</h2>
  <p>
    This update brings RopeScore into the future, with effortless app-scoring
  </p>
  <ul>
    <li>
      The user interface has been redesigned once again, building on old
      themes and ideas but with a more slick layout.
    </li>
    <li>
      The underlying data format has changed drastically, this may pave the
      way for remote sync in an upcoming version
    </li>
    <li>
      App Scoring using
      <a class="text-blue-700 hover:text-blue-900 underline">https://ropescore.app</a>
    </li>
    <li>
      Live speed display when clicking with
      <a class="text-blue-700 hover:text-blue-900 underline">https://ropescore.app</a>
      found on
      <a class="text-blue-700 hover:text-blue-900 underline">https://ropescore.live</a>
    </li>
    <li>
      Marking groups as completed is back, this will show them at the end
      of the home screen list, defaulting to collapsed
    </li>
    <li>
      A new status has been introduces to each entry - Locked.
      This will prevent any further updates to the score, or any re-imports from
      app scoring. The new statuses: unopened (red), in-progress (Blue),
      locked (green), did not skip (green) will be displayed on the category
      dashboard.
    </li>
    <li>
      Judges are now defined per group, rather than per category, this is
      because groups now provide access control in app scoring, and devices are
      therefore per group, and a device can belong to one or more judges
    </li>
  </ul>
  <h2>v3.2.3</h2>
  <ul>
    <li>SvGF Rikshoppet add Level 5 to team difficulty</li>
  </ul>
  <h2>v3.2.2</h2>
  <ul>
    <li>Fixed a bug in IJRU v2.0.0 where all around results wouldn't be shown</li>
    <li>IJRU 2.0.0 Only Level 3 and up will be shown for repeated skills</li>
  </ul>
  <h2>v3.2.1</h2>
  <ul>
    <li>Add SvGF Vikingahoppet (2020)</li>
    <li>Fixed a typo in SvGF Vikingahoppet (2018)</li>
  </ul>
  <h2>v3.2.0</h2>
  <ul>
    <li>Added the ability to paste multiple participants from excel</li>
    <li>Added the ability to export/import v3 format data</li>
    <li>Added a feature to remove all categories from the system</li>
    <li>Bugfixes for repeated skill handling in IJRU v1.1.0</li>
    <li>Bugfixes for tie handling in IJRU v1.1.0</li>
    <li>Add IJRU Rules v2.0.0</li>
    <li>When changing ruleset for an event all scores, judge assignments, and events will now be removed from the event</li>
    <li>When removing a participant their scores will now be deleted</li>
    <li>When removing a judge their scores will now be deleted</li>
    <li>When removing an event all scores for that event will be deleted</li>
    <li>When DNS (Did Not Skip) is toggled on for a participant in one event their scores for that event will be removed</li>
    <li>If a Judge's assignment is changed their scores will be removed for that event</li>
    <li>Add the ability to set judge name and judge IJRU ID for stats purposes</li>
    <li>Show and print results for an entire group at once</li>
    <li>[SvGFRH20] Fix a bug where there was one column to much on the Overall header in the excel export of the individual overall for SvGF Rikshoppet</li>
  </ul>
  <h2>v3.1.4</h2>
  <ul>
    <li>Improved handling of rounding for IJRU rules</li>
    <li>Fix a bug where Required elements judges' reported misses and time- and space violations were reported as 5% each, instead of 2.5% each</li>
  </ul>
  <h2>v3.1.3</h2>
  <ul>
    <li>Bugfix for IJRU Presentation</li>
  </ul>
  <h2>v3.1.2</h2>
  <ul>
    <li>Bugfix for Swedish Rikshoppet</li>
  </ul>
  <h2>v3.1.1</h2>
  <ul>
    <li>Bugfix for Swedish Rikshoppet Rules presentation Double Dutch</li>
    <li>Fix a bug where the ruleset were'n displayed for categories on the dashboard</li>
    <li>Fix a bug where team members couldn't be removed from a team</li>
  </ul>
  <h2>v3.1.0</h2>
  <ul>
    <li>Add Swedish Rikshoppet Rules</li>
  </ul>
  <h2>v3.0.0</h2>
  <p>
    A complete rewrite of RopeScore to add support
    for more than two simultaneous rulesets, people and team management with GDPR in mind,
    and much more all in a neat new design.
  </p>
  <ul>
    <li>Autosave</li>
    <li>Support for more than two rulesets at the same time</li>
    <ul>
      <li>Added Support for IJRU Rules v1.1.0</li>
    </ul>
    <li>Completely redesigned user interface</li>
    <li>When Grouping Categories you can quickly select a group that one of your other categories belongs to</li>
    <li>Updated Excel Export Library, this one should hopefully work better</li>
    <ul>
      <li>Page headers and footers when Printing via Excel</li>
      <li>When printing via Excel the pages are automatically set to landscape and fit-to-page</li>
      <li>Merged Cells works better when exporting to Excel</li>
    </ul>
    <li>Printing directly from within RopeScore has seen numerous improvements</li>
  </ul>
  <h2>v2.10.7</h2>
  <ul>
    <li>Removing some content previously only used for debug</li>
  </ul>
  <h2>v2.10.6</h2>
  <ul>
    <li>A fix to the excel export of a group/all results</li>
  </ul>
  <h2>v2.10.5</h2>
  <ul>
    <li>Add print to MacOS</li>
    <li>Fix override change judge numbers</li>
    <li>Fix for excel import of teams</li>
  </ul>
  <h2>v2.10.4</h2>
  <ul>
    <li>Fix a bug that caused "edit multiple" speed scores to not render</li>
  </ul>
  <h2>v2.10.2</h2>
  <ul>
    <li>Typos in the new printview</li>
  </ul>
  <h2>2.10.1</h2>
  <ul>
    <li>Make judge edit block overridable and inform why it's there</li>
  </ul>
  <h2>v2.10.0</h2>
  <ul>
    <li>
      Results can now be printed directly from the results page instead, with a
      preview functionality to make sure everything fits. This can also be used to
      export directly to pdf, skipping the excel intermediate
    </li>
    <li>
      You can no longer change the amount of judges when scores has been entered,
      neither change to simplified rules. this prevents unexpected results
    </li>
  </ul>
  <h2>v2.9.0</h2>
  <ul>
    <li>Printing from score entering will now print a print-specific view</li>
    <li>
      The NumPad plus (+) can now be used instead of the tab key to move between
      input fields. Simultaneously pressing the shift key will move back one input.
      The NumPad minus (-) will also move back one input
    </li>
    <li>
      Categories can now be grouped, this will replace the old broken sort
      functionality on the dashboard.
    </li>
  </ul>
  <h2>v2.8.0</h2>
  <ul>
    <li>Smoother animations for notifications</li>
    <li>The results for all categories can now be viewed simultaneously</li>
  </ul>
  <h2>v2.7.2</h2>
  <ul>
    <li>Support for removing scores and categories from RopeScore Live</li>
    <li>Support for sending Did Not Skip to RopeScore Live</li>
    <li>Notifications on network status for RopeScore Live</li>
  </ul>
  <h2>v2.7.1</h2>
  <ul>
    <li>Timestamp added to bug report export filenames</li>
  </ul>
  <h2>v2.7.0</h2>
  <ul>
    <li>Initial support for RopeScore Live</li>
    <li>Speed improvements for log collection</li>
    <li>
      <code>Category</code>
      and
      <code>Results</code>
      buttons are no longer shown in the menu whilst creating a new category
    </li>
    <li>Computer names can now be set. This value will not be perserved through exports</li>
    <li>
      Export filenames now contain the date they were exported, and the name of
      the computer they were exported from, the latter only if it has been set
    </li>
    <li>Exported excel filenames now contains the computers name, if set</li>
    <li>The computers name is now shown after "RopeScore" in the menu, if set.</li>
    <li>
      Speed scores won't be calculated at every keystroke when entering multiple
      or all speed scores, improving performance.
    </li>
  </ul>
  <h2>v2.6.1</h2>
  <ul>
    <li>Logs are now preserved through restarts</li>
    <li>
      Fix startup error in
      <code>v2.6.0</code>
    </li>
  </ul>
  <h2>v2.6.0</h2>
  <ul>
    <li>
      Remote Debug log collection, if the computer running the system is connected
      to the internet
    </li>
    <li>Yet another attempt at avoiding team names being parsed as dates</li>
    <li>Team Members Column</li>
    <li>
      Results can now be exported to excel with "Rank Everyone in Everything"
      turned on, a warning will show requiring the operator to confirm that it is
      intended if attempted
    </li>
  </ul>
  <h2>v2.5.2</h2>
  <ul>
    <li>Fix a bug causing some ties to be improperly resolved</li>
  </ul>
  <h2>v2.5.1</h2>
  <ul>
    <li>Sort Completed Categories under a separate header on the Dashboard</li>
    <li>Crosshair in category table</li>
    <li>Fix a bug where "Did Not Skip" isn't accounted for when "Rank All" was on</li>
  </ul>
  <h2>v2.5.0</h2>
  <ul>
    <li>Fix a bug where freestyle ranks weren't calculated properly when Rank All was on</li>
    <li>
      Display multiplied ranks for every event in the "master" table on the top of
      the results page
    </li>
    <li>
      Rewording of the "Display/Hide Rank Factors" button on the category config
      page, to "Enable/Disable Rank Factors"
    </li>
    <li>
      Fix for a bug where the "Reset" button on the dashboard didn't remove the
      events from the dashboard until a reload were performed
    </li>
    <li>
      Fix a bug where the live scores didn't show up if no score had been selected
      to show up previously
    </li>
    <li>Properly show "Did Not Skip" on live speed scores</li>
    <li>
      Automatically cycle through the live speed scores to make sure all of them
      can be seen
    </li>
    <li>
      Fix a bug that made the "Display All" button when entering multiple speed
      scores broken
    </li>
    <li>
      Fix a bug that caused the "False Switches" input box display when entering
      multiple speed scores for skippers that had been marked "Did Not Skip"
    </li>
    <li>
      The Edit button for Skippers that has been marked "Did Not Skip" is now grey
      instead of green
    </li>
  </ul>
  <h2>v2.4.3</h2>
  <ul>
    <li>Fix a bug that causes some events to not display properly</li>
  </ul>
  <h2>v2.4.2</h2>
  <ul>
    <li>Fix for custom speed events lacking a factor to multiply the scores by</li>
  </ul>
  <h2>v2.4.1</h2>
  <ul>
    <li>Rephrasing some texts</li>
  </ul>
  <h2>v2.4.0</h2>
  <ul>
    <li>Improvements to the results tables</li>
  </ul>
  <h2>v2.3.0</h2>
  <ul>
    <li>Category combining makes it possible to combine two categories into one</li>
    <li>
      <b>Changed Ruleset</b>
      to comply with the 2017-2018 rules
    </li>
  </ul>
  <h2>v2.2.6</h2>
  <ul>
    <li>
      Improvements to the "Enter all Speed Scores" page, now all events are in the
      same table
    </li>
  </ul>
  <h2>v2.2.5</h2>
  <ul>
    <li>Bugfix for Excel export of results</li>
    <li>You can now enter all speed scores at once</li>
  </ul>
  <h2>v2.2.4</h2>
  <ul>
    <li>bugfix to freestyle rankings when a score is 0</li>
  </ul>
  <h2>v2.2.3</h2>
  <ul>
    <li>Fixes to Rank all</li>
  </ul>
  <h2>v2.2.2</h2>
  <ul>
    <li>Bugfix for tie resolver</li>
    <li>Improved auto Updating results</li>
  </ul>
  <h2>v2.2.1</h2>
  <ul>
    <li>Minor change of score entering display when simplified levels are enabled</li>
  </ul>
  <h2>v2.2.0</h2>
  <ul>
    <li>
      Overall ties are now automatically resolved according to
      <code>JMC2A5 Tournament Tie</code>
    </li>
    <li>It's no longer to enter space misses or time violations into the head judge box</li>
    <li>Result tables for each event is once again ordered by the ranks in that event</li>
    <li>Re-orderable dashboard</li>
    <li>
      New interpretation of
      <code>JMC3PaA3 Single Rope Required Elements</code>
      received from FISAC, system updated to match
    </li>
    <li>
      Fine tuning of double dutch required elements calculations with regards to
      speed dances, releases, and turner involvement skills
    </li>
  </ul>
  <h2>v2.1.4</h2>
  <ul>
    <li>
      Minor calculation adjustments, resolving rare issue where L1 tricks were
      incorrectly credited
    </li>
  </ul>
  <h2>v2.1.3</h2>
  <ul>
    <li>Ranking bugfix</li>
  </ul>
  <h2>v2.1.2</h2>
  <ul>
    <li>"Did Not Skip" added</li>
    <li>Improvements of presentation weight calculation</li>
    <li>
      Always display 1x rank in results tables as per
      <code>JMC2A4 Freestyles, Masters</code>
    </li>
    <li>Improvements to the round down entered value to max allowed</li>
  </ul>
  <h2>v2.1.1</h2>
  <ul>
    <li>Pressing any key (except tab) will now select checkboxes</li>
    <li>
      Categories can now be marked as completed (the name will turn green on the
      dashboard)
    </li>
    <li>
      Save, and display buttons are now available to the top right of the screen,
      as well as on the bottom
    </li>
    <li>
      "Reskip allowed" warnings (shown at score entering and as a red dot besides
      "Edit" on the category overview)
    </li>
    <li>
      "Edit" on the category overview will be red if no scores have been entered,
      and green if scores have been entered
    </li>
  </ul>
  <h2>v2.1.0</h2>
  <ul>
    <li>
      Rank separately for overall ranking, only including the scores of those
      who've competed in all events
    </li>
  </ul>
  <h2>v2.0.4</h2>
  <ul>
    <li>
      Fixes to a bug with score calculations while entering scores introduced in
      <code>v2.0.2</code>, did not affect final results.
    </li>
  </ul>
  <h2>v2.0.3</h2>
  <ul>
    <li>Backend changes to allow for localised versions</li>
  </ul>
  <h2>v2.0.2</h2>
  <ul>
    <li>Change order of required elements</li>
    <li>Bugfix for Rank Everyone in Everything</li>
  </ul>
  <h2>v2.0.1</h2>
  <ul>
    <li>
      New interpretation of
      <code>JMC2A1S1 Difficulty</code>
      and
      <code>JMC2A1S2 Difficulty</code>
      <br>This interpretation means that an excess of L2 skills can be converted to L2
      skills if there's also an excess of L3 skills.
    </li>
    <li>
      Revert to RopeScore's original interpretation of
      <code>JMC3PaA3 Single Rope Required Elements</code>
    </li>
  </ul>
  <h2>v2.0.0</h2>
  <ul>
    <li>Initial release</li>
  </ul>
</template>
