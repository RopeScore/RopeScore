<template>
  <v-container fluid>
    <v-toolbar class="cust--floating">
      <v-toolbar-title>
        <span>{{ category.config.name }}</span>
        <br />
        <span class="font-weight-bold">{{ event.name }}</span>&nbsp;
      </v-toolbar-title>
      <v-spacer />
      <v-toolbar-items>
        <v-btn link text :to="`/category/${$route.params.id}`" exact class="mr-2">Return</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <div class="pt-12 mt-12">
      <v-card>
        <v-simple-table fixed-header dense>
          <thead>
            <tr>
              <template v-if="category.config.type === 'team'">
                <th>Team Name</th>
                <th>Team Members</th>
              </template>
              <th v-else>Name</th>
              <th>Club</th>
              <th>ID</th>

              <!-- <th

              v-for="eventID in category.config.events"
              :key="`header-${eventID}`"
              colspan="2"
              >{{ eventID }}</th>-->
              <template v-for="judgeType in event.judges">
                <th
                  v-for="judge in category.judges"
                  v-if="judgeAssigned(judge, judgeType)"
                  :key="`header-${judgeType.judgeTypeID}-${judge.judgeID}`"
                  :colspan="judgeType.fields.length"
                  class="text-center"
                >{{ judge.judgeID }}</th>
              </template>

              <th>Score</th>
              <th>DNS</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="participant in participants" :key="participant.participantID" class="crosshair">
              <td>{{ participant.name }}</td>
              <td
                v-if="category.config.type === 'team'"
                class="caption text-truncate"
                max-width="20em"
              >{{ memberNames(participant) }}</td>
              <td>{{ participant.culb }}</td>
              <td>{{ participant.participantID }}</td>

              <template v-for="judgeType in event.judges">
                <template
                  v-for="judge in category.judges"
                  v-if="judgeAssigned(judge, judgeType)"
                >
                  <td
                    v-for="field in judgeType.fields"
                    :key="`entry-${participant.participantID}-${judgeType.judgeTypeID}-${judge.judgeID}-${field.fieldID}`"
                    class="cust--narrow"
                  >
                    <!-- TODO: cap to max and apply style if enters above that? -->
                    <v-text-field
                      type="number"
                      :label="field.name"
                      :min="field.min"
                      :max="field.max"
                      :step="field.step || 1"
                      v-if="!dns(participant)"
                      :value="fieldScore(judge, field, participant)"
                      @input="setScore(judge, field, participant, $event)"
                    />
                    <!-- TODO: checkbox -->
                  </td>
                </template>
              </template>

              <!-- TODO: autodecide which value to show -->
              <td>{{ event.result(participantScoreObj(participant), judgesArr) }}</td>
              <td>
                <v-btn
                  @click="categories.toggleDNS({ id: $route.params.id, eventID: $route.params.event , participantID: participant.participantID })"
                  class="mr-2"
                  text
                  :color="dns(participant) ? 'error' : ''"
                >D{{dns(participant) ? '' : 'N' }}S</v-btn>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { getModule } from 'vuex-module-decorators';
import rulesets, { Rulesets, JudgeType, InputField, Ruleset, EventTypes } from "@/rules";
import CategoriesModule, { Team, Judge, TeamPerson } from '@/store/categories';
import { memberNames } from '@/common'

@Component
export default class ScoreParticipant<VueClass> extends Vue {
  rulesets = rulesets;
  categories = getModule(CategoriesModule)
  memberNames = memberNames

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

  get participants() {
    return this.category.participants
  }

  get judgesArr() {
    return this.categories.categories[this.$route.params.id].judges
      .filter(judge => judge.assignments.findIndex(ass => ass.eventID === this.$route.params.event && ass.judgeTypeID.length > 0) > -1)
      .map(judge => [judge.judgeID, judge.assignments.find(ass => ass.eventID === this.$route.params.event)!.judgeTypeID])
  }

  dns (participant: TeamPerson) {
    return this.category.dns.findIndex(dns => dns.participantID === participant.participantID && dns.eventID === this.$route.params.event) > -1
  }

  participantScoreObj (participant: TeamPerson) {
    return this.categories.participantScoreObj({ id: this.$route.params.id, eventID: this.$route.params.event as EventTypes, participantID: participant.participantID })
  }

  fieldScore (judge: Judge, field: InputField, participant: TeamPerson): string | number {
    const scoreObj = this.participantScoreObj(participant)
    const score = scoreObj[judge.judgeID]?.[field.fieldID]
    return score ?? ''
  }

  setScore (judge: Judge, field: InputField, participant: TeamPerson, value?: number, ) {
    this.categories.setScore({
      id: this.$route.params.id,
      eventID: this.$route.params.event as EventTypes,
      participantID: participant.participantID,

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
}
</script>

<style scoped>
.cust--floating {
  position: fixed;
  width: 96%;
  z-index: 1;
}

.cust--narrow {
  max-width: 5em;
}
</style>
