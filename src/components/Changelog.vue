<template>
  <v-card>
    <v-card-title>Changelog</v-card-title>
    <v-card-text>
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
      <span>
        A complete rewrite of RopeScore to add support
        for more than two simultaneous rulesets, people and team management with GDPR in mind,
        and much more all in a neat new design.
      </span>
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
        <li>A fix to the excel export of a group/all resutls</li>
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
          export directly to pdf, skipping the excel intermidiate
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
        <li>Timestamp added to bugreport export filenames</li>
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
        <li>Yet another attempt at avoiding team names beeing parsed as dates</li>
        <li>Team Members Column</li>
        <li>
          Results can now be exported to excel with "Rank Everyone in Everything"
          turned on, a warning will show requireing the operator to confirm that it is
          intended if attempted
        </li>
      </ul>
      <h2>v2.5.2</h2>
      <ul>
        <li>Fix a bug causing some ties to be inproperly resolved</li>
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
        <li>Reorderable dashboard</li>
        <li>
          New interpretation of
          <code>JMC3PaA3 Single Rope Required Elements</code>
          recieved from fisac, system updated to match
        </li>
        <li>
          Fine tuning of double dutch required elements calculations with regards to
          speed dances, releases, and turner involvment skills
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
          Save, and display buttons are now avilable to the top right of the screen,
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
          <br />This interpretation means that an excess of L2 skills can be converted to L2
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
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Changelog extends Vue {}
</script>
