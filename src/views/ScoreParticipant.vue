<template>
  <v-container fluid>
    <v-toolbar class="cust--floating">
      <v-toolbar-title>
        <span>{{ category.config.name }}</span>
        <br />
        <span class="font-weight-bold">{{ event.name }}</span>&nbsp;
        <span class="font-weight-light">Score for</span>&nbsp;
        <span class="font-weight-bold">{{ participant.name }}</span>&nbsp;
        <span class="font-weight-light">from</span>&nbsp;
        <span class="font-weight-bold">{{ participant.club }}</span>&nbsp;
        <span class="font-weight-light">({{ $route.params.participant }})</span>
      </v-toolbar-title>
      <v-spacer />
      <v-toolbar-items>
        <v-btn link text :to="`/category/${$route.params.id}`" exact class="mr-2">Return</v-btn>
        <v-btn
          link
          text
          :to="`/category/${$route.params.id}/score/${$route.params.event}/${previousParticipant($route.params.participant)}`"
          :disabled="!previousParticipant($route.params.participant)"
          exact
          class="mr-2"
        >Previous</v-btn>
        <v-btn
          link
          text
          :to="`/category/${$route.params.id}/score/${$route.params.event}/${nextParticipant($route.params.participant)}`"
          :disabled="!nextParticipant($route.params.participant)"
          exact
          class="mr-2"
        >Next</v-btn>
        <v-btn
          @click="categories.toggleDNS({ id: $route.params.id, eventID: $route.params.event , participantID: $route.params.participant })"
          class="mr-2"
          text
          :color="dns ? 'error' : ''"
        >Did {{ dns ? '' : 'Not' }} Skip</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <div
      class="mt-12"
      v-if="!dns"
    >
      <v-layout v-for="judgeType in event.judges" :key="judgeType.judgeTypeID" wrap class="pt-6">
        <v-flex xs12>
          <v-card-title>{{ judgeType.name }} ({{ judgeType.judgeTypeID }})</v-card-title>
        </v-flex>
        <v-flex
          xs12
          sm6
          md4
          lg3
          v-for="judge in category.judges"
          :key="`${judgeType.judgeTypeID}-${judge.judgeID}`"
          pa-2
          v-if="judgeAssigned(judge, judgeType)"
        >
          <v-card>
            <v-card-title>
              <span>{{ judge.judgeID }}</span>
              <span
                class="font-weight-light"
                v-if="judge.name"
              >: {{ judge.name }}</span>
            </v-card-title>
            <v-card-text>
              <div
                v-for="field in judgeType.fields"
                :key="`${judgeType.judgeTypeID}-${judge.judgeID}-${field.fieldID}`"
              >
                <!-- TODO: cap to max and apply style if enters above that? -->
                <v-text-field
                  type="number"
                  :label="field.name"
                  :min="field.min"
                  :max="field.max"
                  :step="field.step || 1"
                  :value="fieldScore(judge, field)"
                  @input="setScore(judge, field, $event)"
                />
                <!-- TODO: checkbox -->
              </div>
              <v-divider />
              <v-simple-table>
                <tbody>
                  <tr
                    v-for="(value, fieldID) in judgeType.result(participantScoreObj[judge.judgeID] || {})"
                    :key="`${judgeType.judgeTypeID}-${judge.judgeID}-${fieldID}`"
                  >
                    <td>{{ fieldID }}</td>
                    <td class="text-right">{{ value }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card-text>
          </v-card>
        </v-flex>
      </v-layout>
    </div>
    <v-card
      v-if="!dns"
    >
      <v-simple-table>
        <!-- TODO: don't run .result twice -->
        <thead>
          <tr>
            <th
              v-for="(value, fieldID) in event.result(participantScoreObj, judgesArr)"
              :key="`header-final-${fieldID}`"
            >{{ fieldID }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              v-for="(value, fieldID) in event.result(participantScoreObj, judgesArr)"
              :key="`score-final-${fieldID}`"
            >{{ value }}</td>
          </tr>
        </tbody>
      </v-simple-table>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { getModule } from 'vuex-module-decorators'
import { wrap } from "comlink";
import rulesets, { Rulesets, JudgeType, InputField, Ruleset, EventTypes } from "@/rules";
import CategoriesModule, { Team, Judge } from '@/store/categories';

@Component
export default class ScoreParticipant<VueClass> extends Vue {
  rulesets = rulesets;
  categories = getModule(CategoriesModule)

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

  get event() {
    return (this.ruleset?.events as Ruleset['events']).find(
      el => el.eventID === this.$route.params.event
    );
  }

  get participant() {
    return this.category.participants.find(par => par.participantID === this.$route.params.participant);
  }

  get judgesArr() {
    return this.categories.categories[this.$route.params.id].judges
      .filter(judge => judge.assignments.findIndex(ass => ass.eventID === this.$route.params.event && ass.judgeTypeID.length > 0) > -1)
      .map(judge => [judge.judgeID, judge.assignments.find(ass => ass.eventID === this.$route.params.event)!.judgeTypeID])
  }

  get dns () {
    return this.category.dns.findIndex(dns => dns.participantID === this.$route.params.participant && dns.eventID === this.$route.params.event) > -1
  }

  get participantScoreObj () {
    return this.categories.participantScoreObj({ id: this.$route.params.id, eventID: this.$route.params.event as EventTypes, participantID: this.$route.params.participant })
  }

  fieldScore (judge: Judge, field: InputField): string | number {
    const scoreObj = this.participantScoreObj
    const score = scoreObj[judge.judgeID]?.[field.fieldID]
    return score ?? ''
  }

  setScore (judge: Judge, field: InputField, value?: number) {
    this.categories.setScore({
      id: this.$route.params.id,
      eventID: this.$route.params.event as EventTypes,
      participantID: this.$route.params.participant,

      judgeID: judge.judgeID,
      fieldID: field.fieldID,
      min: field.min,
      max: field.max,
      step: field.step,
      value
    })
  }

  judgeAssigned (judge: Judge, judgeType: JudgeType) {
    return judge.assignments.findIndex(ass => ass.judgeTypeID === judgeType.judgeTypeID && ass.eventID === this.$route.params.event) > -1
  }

  nextParticipant(partId: string): string | undefined {
    const idx = this.category.participants.findIndex(par => par.participantID === partId) + 1;

    if (idx === this.category.participants.length) return undefined;
    return this.category.participants[idx].participantID;
  }

  previousParticipant(partId: string): string | undefined {
    const idx = this.category.participants.findIndex(par => par.participantID === partId) - 1;

    if (idx < 0) return undefined;
    return this.category.participants[idx].participantID;
  }
}
</script>

<style scoped>
.cust--floating {
  position: fixed;
  width: 96%;
  z-index: 1;
}
</style>
