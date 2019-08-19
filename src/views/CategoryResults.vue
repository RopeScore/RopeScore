<template>
  <v-container fluid>
    <!-- Overall -->
    <ResultTable
      v-for="overall in ruleset.overalls"
      :key="overall.id"
      v-if="overall.type === $store.state.categories[$route.params.id].config.type"
      :print-view="printView"
      title="Overall"
      :type="$store.state.categories[$route.params.id].config.type"
      :headers="overall"
      :results="overallRanks(overall)"
      :people="$store.state.people.people"
      :teams="$store.state.people.teams"
    />
    <!-- Events -->
    <ResultTable
      v-for="event in $store.state.categories[$route.params.id].config.events"
      :key="event"
      :print-view="printView"
      :title="eventByID(event).name"
      :type="$store.state.categories[$route.params.id].config.type"
      :headers="eventByID(event).headers"
      :results="rankedResults[event]"
      :people="$store.state.people.people"
      :teams="$store.state.people.teams"
    />
  </v-container>
</template>

<script lang="ts">
import { Component, Props, Vue } from 'vue-property-decorator';
import rulesets from '@/rules';
import ResultTable from '@/components/ResultTable';

@Component({
  components: {
    ResultTable
  }
})
export default class Results<VueClass> extends Vue {
  rulesets = rulesets;
  printView: boolean = false;

  get ruleset () {
    return this.rulesets[
      this.$store.state.categories[this.$route.params.id].config.ruleset
    ]
  }

  eventByID (eventID) {
    return this.ruleset.events.filter(el => el.id === eventID)[0]
  }

  judgesArr (event) {
    return this.$store.state.categories[this.$route.params.id].judges
      .filter(el => !!el[event])
      .map(el => [el.id, el[event]])
  }

  eventResults (event): any[] {
    let results = []

    let scores = this.$store.getters['categories/eventScoreObj']({
      id: this.$route.params.id,
      event
    })
    let participants = Object.keys(scores)
    let eventObj = this.eventByID(event)

    results = participants.map(participant => ({
      participant,
      ...eventObj.result(scores[participant], this.judgesArr(event))
    }))

    return results
  }

  get results () {
    let results = {}
    for (let event of this.$store.state.categories[this.$route.params.id].config
      .events) {
      results[event] = this.eventResults(event)
    }
    return results
  }

  get rankedResults () {
    let ranked = {}

    for (let event in this.results) {
      const eventObj = this.eventByID(event)
      ranked[event] = eventObj.rank(this.results[event])
    }

    console.log(ranked)

    return ranked
  }

  overallResults (overall) {
    let results = {}
    let participants = {}
    const eventObj = this.eventByID(event)

    // TODO: there must be a quicker/simpler way to do this...

    overall.events.forEach(event =>
      this.results[event].forEach(result => {
        if (!participants[result.participant]) {
          participants[result.participant] = []
        }
        participants[result.participant].push(event)
      })
    )

    let inAll = Object.keys(participants).filter(
      participant => participants[participant].length === overall.events.length
    )

    overall.events.forEach(event => {
      if (!results[event]) results[event] = []

      inAll.forEach(participant => {
        let idx = this.results[event].findIndex(
          el => el.participant === participant
        )
        results[event].push({ ...this.results[event][idx] })
      })
    })

    return results
  }

  overallRanks (overall) {
    let results = this.overallResults(overall)

    let ranked = overall.rank(results)

    return ranked
  }
}
</script>
