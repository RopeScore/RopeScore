<template>
  <v-container fluid>
    <!-- Overall -->
    <v-card class="mb-4">
      <v-card-text>
        Printers are stupid, make sure you do the following before printing:
        <ol>
          <li>Zoom the pages below so all of the results fits on the pages</li>
          <li>Click Print (or Ctrl+P/Cmd+P)</li>
          <li>Change the paper orientation to landscape</li>
        </ol>
      </v-card-text>
      <v-card-text>
        Excel is a stupid file format, at this point in time logos aren't supported in Excel exports.
        <br />the category name and result table name will be displayed in the page header when printing/exporting to pdf via excel
      </v-card-text>
      <v-card-actions>
        <v-btn @click="print()" color="primary" text>Print</v-btn>
        <ExcelWorkbook :title="excelTitle">
          <template v-for="id in selectedCategories">
            <ExcelResultTable
              v-for="overall in overalls(id)"
              :key="`excelsheet-${id}-${overall.overallID}`"
              :id="overall.overallID"
              :category="category(id).config.name"
              :group="category(id).config.group"
              :title="overall.text"
              :type="category(id).config.type"
              :headers="overall"
              :results="overallRanks(id, overall)"
              :participants="category(id).participants"
              :logo="(category(id).printConfig || {}).logo"
            />

            <ExcelResultTable
              v-for="eventID in category(id).config.events"
              :key="`excelsheet-${id}-${eventID}`"
              :id="eventID"
              :category="category(id).config.name"
              :group="category(id).config.group"
              :title="eventByID(id, eventID).name"
              :type="category(id).config.type"
              :headers="eventByID(id, eventID).headers"
              :results="rankedResults(id)[eventID]"
              :participants="category(id).participants"
              :logo="(category(id).printConfig || {}).logo"
            />
          </template>
        </ExcelWorkbook>
        <v-btn @click="imageSelect()" text>Set Logo</v-btn>
        <v-btn
          v-if="hasLogo"
          color="error"
          text
          @click="removeLogos()"
        >Remove Logo</v-btn>
      </v-card-actions>
    </v-card>
    <template v-for="id in selectedCategories">
      <ResultTable
        v-for="overall in overalls(id)"
        :key="`${id}-${overall.overallID}`"
        :print-view="printView"
        :category="category(id).config.name"
        :group="category(id).config.group"
        :title="overall.text"
        :type="category(id).config.type"
        :headers="overall"
        :results="overallRanks(id, overall)"
        :participants="category(id).participants"
        :logo="(category(id).printConfig || {}).logo"
        :exclude="excluded(id, overall.overallID)"
        :zoom="categories.tableZoom({ id, table: overall.overallID})"
        @zoomchange="zoomChanged(id, overall.overallID, $event)"
        @printchange="categories._toggleExcludeTable({ id, table: overall.overallID })"
      />
      <!-- Events -->
      <ResultTable
        v-for="eventID in category(id).config.events"
        :key="`${id}-${eventID}`"
        :print-view="printView"
        :category="category(id).config.name"
        :group="category(id).config.group"
        :title="eventByID(id, eventID).name"
        :type="category(id).config.type"
        :headers="eventByID(id, eventID).headers"
        :results="rankedResults(id)[eventID]"
        :participants="category(id).participants"
        :logo="(category(id).printConfig || {}).logo"
        :exclude="excluded(id, eventID)"
        :zoom="categories.tableZoom({ id, table: eventID})"
        @should-print="updateWorksheet('hello')"
        @zoomchange="zoomChanged(id, eventID, $event)"
        @printchange="categories._toggleExcludeTable({ id, table: eventID })"
      />
    </template>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { getModule } from "vuex-module-decorators";
import rulesets, { Overall, Ruleset, EventTypes, Overalls } from "@/rules";
import ResultTable from "@/components/ResultTable.vue";
import ExcelWorkbook from "@/components/ExcelWorkbook.vue";
import ExcelResultTable from "@/components/ExcelResultTable.vue";
import CategoriesModule from '../store/categories';

export interface ResultObj { participantID: string; [prop: string]: any }
export interface ResultsObj { [eventID: string]: ResultObj[] }

@Component({
  components: {
    ResultTable,
    ExcelResultTable,
    ExcelWorkbook
  }
})
export default class Results<VueClass> extends Vue {
  categories = getModule(CategoriesModule)
  rulesets = rulesets;
  printView: boolean = false;

  created () {
    console.log('categories:', this.selectedCategories)
  }

  get selectedCategories () {
    if (this.$route.params.id) return [this.$route.params.id]
    else if (this.$route.params.name) {
      const groupName = atob(decodeURIComponent(this.$route.params.name))
      return this.categories.categoriesWithInfo.filter(cat => cat.group === groupName).map(cat => cat.id)
    }
    else return []
  }

  get isGroup () {
    return this.selectedCategories.length > 1
  }

  get excelTitle () {
    return this.category(this.selectedCategories[0]).config[this.isGroup ? 'group' : 'name'] ?? (this.isGroup ? 'Ungrouped' : 'Unnamed')
  }

  ruleset (id: string) {
    return this.rulesets.find(
      rs =>
        rs.rulesetID ===
        this.category(id).config.ruleset
    );
  }

  category (id: string) {
    return this.categories.categories[id]
  }

  overalls (id: string) {
    const overalls = (this.ruleset(id)?.overalls as Ruleset['overalls']).filter(
      el =>
        el.type ===
        this.category(id).config.type
    );
    return overalls
  }

  eventByID (id: string, eventID: string) {
    return (this.ruleset(id)?.events as Ruleset['events']).find(el => el.eventID === eventID);
  }

  judgesArr (id: string, eventID: string): [string, string][] {
    return this.category(id).judges
      .filter(judge => judge.assignments.findIndex(ass => ass.eventID === eventID && ass.judgeTypeID.length > 0) > -1)
      .map(judge => [judge.judgeID, judge.assignments.find(ass => ass.eventID === eventID)!.judgeTypeID])
  }

  eventResults(id: string, eventID: EventTypes): { participantID: string; [prop: string]: any }[] {
    let results = [];

    let scores = this.categories.eventScoreObj({
      id,
      eventID
    });
    let participants = Object.keys(scores).filter(partID => this.category(id).participants.map(p => p.participantID).includes(partID));
    let eventObj = this.eventByID(id, eventID);

    if (!eventObj) return []

    results = participants.map(participantID => ({
      participantID,
      ...eventObj!.result(scores[participantID], this.judgesArr(id, eventID))
    }));

    return results;
  }

  results (id: string) {
    let results: ResultsObj = {}
    for (let eventID of this.category(id).config.events || []) {
      results[eventID] = this.eventResults(id, eventID);
    }
    return results;
  }

  rankedResults (id: string) {
    let ranked: { [eventID: string]: any } = {} // TODO: type

    let results = this.results(id)

    for (let eventID in results) {
      const eventObj = this.eventByID(id, eventID);
      if (!eventObj) continue
      ranked[eventID] = eventObj.rank(results[eventID]);
    }

    console.log(ranked);

    return ranked;
  }

  overallResults(id: string, overall: Overall) {
    let calculatedResults: ResultsObj = {};
    let participants: { [participantID: string]: string[] } = {};

    // TODO: there must be a quicker/simpler way to do this...

    const resultsCache = this.results(id)

    ; (overall.events || []).forEach(eventID =>
      (resultsCache[eventID] || []).forEach(result => {
        if (!participants[result.participantID]) {
          participants[result.participantID] = [];
        }
        participants[result.participantID].push(eventID);
      })
    );

    let inAll = Object.keys(participants).filter(
      participantID => participants[participantID].length === overall.events.length
    );

    overall.events.forEach(eventID => {
      if (!calculatedResults[eventID]) calculatedResults[eventID] = [];

      inAll.forEach(participantID => {
        let idx = resultsCache[eventID].findIndex(
          el => el.participantID === participantID
        );
        calculatedResults[eventID].push({ ...resultsCache[eventID][idx] });
      });
    });

    return calculatedResults;
  }

  overallRanks(id: string, overall: Overall) {
    let results = this.overallResults(id, overall);

    let ranked = overall.rank(results);

    return ranked;
  }

  print() {
    window.print();
  }

  zoomChanged(id: string, table: EventTypes | Overalls, value: number) {
    this.categories.zoomChange({
      id,
      table,
      value
    });
  }

  excluded (id: string, table: EventTypes | Overalls) {
    return (this.category(id)?.printConfig?.exclude ?? []).includes(table)
  }

  imageSelect() {
    let input = document.createElement("input");
    const self = this
    input.type = "file";
    input.accept = 'image/*'

    input.onchange = e => {
      let file = (e.target as HTMLInputElement & EventTarget)?.files?.[0];
      if (!file?.type.match("image.*")) return;

      let reader = new FileReader();
      reader.onload = readerEvent => {
        let data = readerEvent.target?.result as string;

        for (const id of self.selectedCategories) {
          self.categories.printLogo({
            id,
            value: data
          });
        }
      }
      reader.readAsDataURL(file);
    };

    input.click();
  }

  removeLogos() {
    for (const id of this.selectedCategories) {
      this.categories.printLogo({ id })
    }
  }

  get hasLogo () {
    for (const id of this.selectedCategories) {
      if (this.category(id)?.printConfig?.logo) return true
    }
    return false
  }
}
</script>
