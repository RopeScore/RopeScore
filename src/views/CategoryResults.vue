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
        <ExcelWorkbook :title="category.config.name">
          <ExcelResultTable
            v-for="overall in overalls"
            :key="`excelsheet-${overall.overallID}`"
            :id="overall.overallID"
            :category="category.config.name"
            :title="overall.text"
            :type="category.config.type"
            :headers="overall"
            :results="overallRanks(overall)"
            :participants="category.participants"
            :logo="(category.printConfig || {}).logo"
          />

          <ExcelResultTable
            v-for="event in category.config.events"
            :key="`excelsheet-${event}`"
            :id="event"
            :category="category.config.name"
            :title="eventByID(event).name"
            :type="category.config.type"
            :headers="eventByID(event).headers"
            :results="rankedResults[event]"
            :participants="category.participants"
            :logo="category.printConfig.logo"
          />
        </ExcelWorkbook>
        <v-btn @click="imageSelect()" text>{{ category.printConfig.logo ? 'Replace' : 'Add' }} Logo</v-btn>
        <v-btn
          v-if="category.printConfig.logo"
          color="error"
          text
          @click="categories.printLogo({ id: $route.params.id })"
        >Remove Logo</v-btn>
      </v-card-actions>
    </v-card>
    <ResultTable
      v-for="overall in overalls"
      :key="overall.overallID"
      :print-view="printView"
      :category="category.config.name"
      :title="overall.text"
      :type="category.config.type"
      :headers="overall"
      :results="overallRanks(overall)"
      :participants="category.participants"
      :logo="(category.printConfig || {}).logo"
      :exclude="((category.printConfig || {})[overall.overallID] || {}).exclude"
      @printchange="categories.excludePrint({ id: $route.params.id, table: overall.overallID })"
      :zoom="((category.printConfig || {})[overall.overallID] || {}).zoom"
      @zoomchange="zoomChanged(overall.overallID, $event)"
    />
    <!-- Events -->
    <ResultTable
      v-for="event in category.config.events"
      :key="event"
      :print-view="printView"
      :category="category.config.name"
      :title="eventByID(event).name"
      :type="category.config.type"
      :headers="eventByID(event).headers"
      :results="rankedResults[event]"
      :participants="category.participants"
      :logo="(category.printConfig || {}).logo"
      :exclude="((category.printConfig || {})[event] || {}).exclude"
      :zoom="((category.printConfig || {})[event] || {}).zoom"
      @should-print="updateWorksheet('hello')"
      @zoomchange="zoomChanged(event, $event)"
    />
      <!-- @printchange="$store.dispatch('categories/excludePrint', { id: $route.params.id, table: event, value: $event })" -->
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { getModule } from "vuex-module-decorators";
import rulesets, { Overall } from "@/rules";
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

  get ruleset() {
    return this.rulesets.find(
      rs =>
        rs.rulesetID ===
        this.category.config.ruleset
    );
  }

  get category () {
    return this.categories.categories[this.$route.params.id]
  }

  get overalls() {
    return this.ruleset?.overalls.filter(
      el =>
        el.type ===
        this.category.config.type
    );
  }

  eventByID(eventID: string) {
    return this.ruleset?.events.find(el => el.eventID === eventID);
  }

  judgesArr (eventID: string) {
    return this.categories.categories[this.$route.params.id].judges
      .filter(judge => judge.assignments.findIndex(ass => ass.eventID === eventID && ass.judgeTypeID.length > 0) > -1)
      .map(judge => [judge.judgeID, judge.assignments.find(ass => ass.eventID === eventID)!.judgeTypeID])
  }

  eventResults(eventID: string): { participantID: string; [prop: string]: any }[] {
    let results = [];

    let scores = this.categories.eventScoreObj({
      id: this.$route.params.id,
      eventID
    });
    let participants = Object.keys(scores);
    let eventObj = this.eventByID(eventID);

    if (!eventObj) return []

    results = participants.map(participantID => ({
      participantID,
      ...eventObj!.result(scores[participantID], this.judgesArr(eventID))
    }));

    return results;
  }

  get results() {
    let results: ResultsObj = {}
    for (let eventID of this.category.config.events || []) {
      results[eventID] = this.eventResults(eventID);
    }
    return results;
  }

  get rankedResults() {
    let ranked: { [eventID: string]: any } = {} // TODO: type

    for (let eventID in this.results) {
      const eventObj = this.eventByID(eventID);
      if (!eventObj) continue
      ranked[eventID] = eventObj.rank(this.results[eventID]);
    }

    console.log(ranked);

    return ranked;
  }

  overallResults(overall: Overall) {
    let results: ResultsObj = {};
    let participants: { [participantID: string]: string[] } = {};

    // TODO: there must be a quicker/simpler way to do this...

    overall.events.forEach(eventID =>
      this.results[eventID].forEach(result => {
        if (!participants[result.participantID]) {
          participants[result.participantID] = [];
        }
        participants[result.participantID].push(eventID);
      })
    );

    let inAll = Object.keys(participants).filter(
      participant => participants[participant].length === overall.events.length
    );

    overall.events.forEach(eventID => {
      if (!results[eventID]) results[eventID] = [];

      inAll.forEach(participant => {
        let idx = this.results[eventID].findIndex(
          el => el.participant === participant
        );
        results[eventID].push({ ...this.results[eventID][idx] });
      });
    });

    return results;
  }

  overallRanks(overall: Overall) {
    let results = this.overallResults(overall);

    let ranked = overall.rank(results);

    return ranked;
  }

  print() {
    window.print();
  }

  zoomChanged(table: string, value: number) {
    this.categories.zoomChange({
      id: this.$route.params.id,
      table,
      value
    });
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
        self.categories.printLogo({
          id: self.$route.params.id,
          value: data
        });
      }
      reader.readAsDataURL(file);
    };

    input.click();
  }
}
</script>
