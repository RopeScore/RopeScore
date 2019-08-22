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
        <ExcelWorkbook :title="$store.state.categories[$route.params.id].config.name">
          <ExcelResultTable
            v-for="overall in overalls"
            :key="`excelsheet-${overall.id}`"
            :id="overall.id"
            :category="$store.state.categories[$route.params.id].config.name"
            :title="overall.text"
            :type="$store.state.categories[$route.params.id].config.type"
            :headers="overall"
            :results="overallRanks(overall)"
            :people="$store.state.people.people"
            :teams="$store.state.people.teams"
            :logo="($store.state.categories[$route.params.id].printConfig || {}).logo"
          />

          <ExcelResultTable
            v-for="event in $store.state.categories[$route.params.id].config.events"
            :key="`excelsheet-${event}`"
            :id="event"
            :category="$store.state.categories[$route.params.id].config.name"
            :title="eventByID(event).name"
            :type="$store.state.categories[$route.params.id].config.type"
            :headers="eventByID(event).headers"
            :results="rankedResults[event]"
            :people="$store.state.people.people"
            :teams="$store.state.people.teams"
            :logo="($store.state.categories[$route.params.id].printConfig || {}).logo"
          />
        </ExcelWorkbook>
        <v-btn @click="imageSelect()" text>Add Logo</v-btn>
        <v-btn
          @click="$store.dispatch('categories/printLogo', { id: $route.params.id })"
          v-if="($store.state.categories[$route.params.id].printConfig || {}).logo"
          color="error"
          text
        >Remove Logo</v-btn>
      </v-card-actions>
    </v-card>
    <ResultTable
      v-for="overall in overalls"
      :key="overall.id"
      :print-view="printView"
      :category="$store.state.categories[$route.params.id].config.name"
      :title="overall.text"
      :type="$store.state.categories[$route.params.id].config.type"
      :headers="overall"
      :results="overallRanks(overall)"
      :people="$store.state.people.people"
      :teams="$store.state.people.teams"
      :logo="($store.state.categories[$route.params.id].printConfig || {}).logo"
      :exclude="(($store.state.categories[$route.params.id].printConfig || {})[overall.id] || {}).exclude"
      @printchange="$store.dispatch('categories/excludePrint', { id: $route.params.id, table: overall.id, value: $event })"
      :zoom="(($store.state.categories[$route.params.id].printConfig || {})[overall.id] || {}).zoom"
      @zoomchange="zoomChanged(overall.id, $event)"
    />
    <!-- Events -->
    <ResultTable
      v-for="event in $store.state.categories[$route.params.id].config.events"
      :key="event"
      :print-view="printView"
      :category="$store.state.categories[$route.params.id].config.name"
      :title="eventByID(event).name"
      :type="$store.state.categories[$route.params.id].config.type"
      :headers="eventByID(event).headers"
      :results="rankedResults[event]"
      :people="$store.state.people.people"
      :teams="$store.state.people.teams"
      :logo="($store.state.categories[$route.params.id].printConfig || {}).logo"
      :exclude="(($store.state.categories[$route.params.id].printConfig || {})[event] || {}).exclude"
      @printchange="$store.dispatch('categories/excludePrint', { id: $route.params.id, table: event, value: $event })"
      :zoom="(($store.state.categories[$route.params.id].printConfig || {})[event] || {}).zoom"
      @should-print="updateWorksheet('hello')"
      @zoomchange="zoomChanged(event, $event)"
    />
  </v-container>
</template>

<script lang="ts">
import { Component, Props, Vue } from "vue-property-decorator";
import rulesets from "@/rules";
import ResultTable from "@/components/ResultTable";
import ExcelWorkbook from "@/components/ExcelWorkbook";
import ExcelResultTable from "@/components/ExcelResultTable";

@Component({
  components: {
    ResultTable,
    ExcelResultTable,
    ExcelWorkbook
  }
})
export default class Results<VueClass> extends Vue {
  rulesets = rulesets;
  printView: boolean = false;

  get ruleset() {
    return this.rulesets[
      this.$store.state.categories[this.$route.params.id].config.ruleset
    ];
  }

  get overalls() {
    return this.ruleset.overalls.filter(
      el =>
        el.type ===
        this.$store.state.categories[this.$route.params.id].config.type
    );
  }

  eventByID(eventID) {
    return this.ruleset.events.filter(el => el.id === eventID)[0];
  }

  judgesArr(event) {
    return this.$store.state.categories[this.$route.params.id].judges
      .filter(el => !!el[event])
      .map(el => [el.id, el[event]]);
  }

  eventResults(event): any[] {
    let results = [];

    let scores = this.$store.getters["categories/eventScoreObj"]({
      id: this.$route.params.id,
      event
    });
    let participants = Object.keys(scores);
    let eventObj = this.eventByID(event);

    results = participants.map(participant => ({
      participant,
      ...eventObj.result(scores[participant], this.judgesArr(event))
    }));

    return results;
  }

  get results() {
    let results = {};
    for (let event of this.$store.state.categories[this.$route.params.id].config
      .events) {
      results[event] = this.eventResults(event);
    }
    return results;
  }

  get rankedResults() {
    let ranked = {};

    for (let event in this.results) {
      const eventObj = this.eventByID(event);
      ranked[event] = eventObj.rank(this.results[event]);
    }

    console.log(ranked);

    return ranked;
  }

  overallResults(overall) {
    let results = {};
    let participants = {};
    const eventObj = this.eventByID(event);

    // TODO: there must be a quicker/simpler way to do this...

    overall.events.forEach(event =>
      this.results[event].forEach(result => {
        if (!participants[result.participant]) {
          participants[result.participant] = [];
        }
        participants[result.participant].push(event);
      })
    );

    let inAll = Object.keys(participants).filter(
      participant => participants[participant].length === overall.events.length
    );

    overall.events.forEach(event => {
      if (!results[event]) results[event] = [];

      inAll.forEach(participant => {
        let idx = this.results[event].findIndex(
          el => el.participant === participant
        );
        results[event].push({ ...this.results[event][idx] });
      });
    });

    return results;
  }

  overallRanks(overall) {
    let results = this.overallResults(overall);

    let ranked = overall.rank(results);

    return ranked;
  }

  print() {
    window.print();
  }

  zoomChanged(table: string, zoom: number) {
    this.$store.dispatch("categories/zoomChange", {
      id: this.$route.params.id,
      table,
      zoom
    });
  }

  imageSelect() {
    let input = document.createElement("input");
    input.type = "file";

    input.onchange = e => {
      let file = e.target.files[0];
      if (!file.type.match("image.*")) return;

      let reader = new FileReader();
      reader.onload = function(readerEvent) {
        let data = readerEvent.target.result;
        this.$store.dispatch("categories/printLogo", {
          id: this.$route.params.id,
          data
        });
      }.bind(this);
      reader.readAsDataURL(file);
    };

    input.click();
  }
}
</script>
