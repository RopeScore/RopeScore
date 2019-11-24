<template>
  <v-container fluid>
    <v-toolbar class="cust--floating">
      <v-toolbar-title>
        <span>{{ $store.state.categories[$route.params.id].config.name }}</span>
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
          @click="$store.dispatch('categories/toggleDNS', { id: $route.params.id, event: $route.params.event, participant: $route.params.participant })"
          class="mr-2"
          text
          :color="$store.getters['categories/dns']({ id: $route.params.id, event: $route.params.event, participant: $route.params.participant }) ? 'error' : ''"
        >Did {{ $store.getters['categories/dns']({ id: $route.params.id, event: $route.params.event, participant: $route.params.participant }) ? '' : 'Not' }} Skip</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <div
      class="mt-12"
      v-if="!$store.getters['categories/dns']({ id: $route.params.id, event: $route.params.event, participant: $route.params.participant })"
    >
      <v-layout v-for="judgeType in event.judges" :key="judgeType.id" wrap class="pt-6">
        <v-flex xs12>
          <v-card-title>{{ judgeType.name }} ({{ judgeType.id }})</v-card-title>
        </v-flex>
        <v-flex
          xs12
          sm6
          md4
          lg3
          v-for="judge in $store.state.categories[$route.params.id].judges"
          v-if="judge[event.id] === judgeType.id"
          :key="`${judgeType.id}-${judge.id}`"
          pa-2
        >
          <v-card>
            <v-card-title>
              <span>{{ judge.id }}:</span>&nbsp;
              <span
                class="font-weight-light"
              >{{ ($store.state.people.people[judge.id] || {}).name }}</span>
            </v-card-title>
            <v-card-text v-if="JudgeIsConfigured(judge.id)">
              <div
                v-for="field in judgeType.fields"
                :key="`${judgeType.id}-${judge.id}-${field.id}`"
              >
                <!-- TODO: cap to max and apply style if enters above that? -->
                <v-text-field
                  type="number"
                  :label="field.name"
                  :min="field.min"
                  :max="field.max"
                  :step="field.step || 1"
                  :value="$store.getters['categories/fieldScore']({ id: $route.params.id, event: $route.params.event, participant: $route.params.participant, judgeID: judge.id, field: field.id})"
                  @input="$store.dispatch('categories/setScore', { id: $route.params.id, event: $route.params.event, participant: $route.params.participant, judgeID: judge.id, field: field.id, value: $event, min: field.min, max: field.max, step: field.step })"
                />
                <!-- TODO: checkbox -->
              </div>
              <v-divider />
              <v-simple-table>
                <tbody>
                  <tr
                    v-for="(value, field) in judgeType.result($store.getters['categories/participantScoreObj']({ id: $route.params.id, event: $route.params.event, participant: $route.params.participant })[judge.id] ||{})"
                    :key="`${judgeType.id}-${judge.id}-${field}`"
                  >
                    <td>{{ field }}</td>
                    <td class="text-right">{{ value }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card-text>
            <template v-else>
              <v-card-text>This Judge hasn't been properly configured</v-card-text>
              <v-card-actions>
                <v-btn
                  text
                  link
                  :to="`/category/${$route.params.id}/config?step=4`"
                >Configure Category</v-btn>
              </v-card-actions>
            </template>
          </v-card>
        </v-flex>
      </v-layout>
    </div>
    <v-card
      v-if="!$store.getters['categories/dns']({ id: $route.params.id, event: $route.params.event, participant: $route.params.participant })"
    >
      <v-simple-table>
        <!-- TODO: don't run .result twice -->
        <thead>
          <tr>
            <th
              v-for="(value, field) in event.result($store.getters['categories/participantScoreObj']({ id: $route.params.id, event: $route.params.event, participant: $route.params.participant }), judgesArr)"
              :key="`header-final-${field}`"
            >{{ field }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              v-for="(value, field) in event.result($store.getters['categories/participantScoreObj']({ id: $route.params.id, event: $route.params.event, participant: $route.params.participant }), judgesArr)"
              :key="`header-final-${field}`"
            >{{ value }}</td>
          </tr>
        </tbody>
      </v-simple-table>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { Component, Props, Vue } from "vue-property-decorator";
import rulesets, { Rulesets } from "@/rules/score.worker";
import { wrap } from "comlink";
// import TableHeader from '@/plugins/vuetify';

@Component
export default class ScoreParticipant<VueClass> extends Vue {
  rulesets = wrap<Rulesets>(rulesets);

  get ruleset() {
    return this.rulesets[
      this.$store.state.categories[this.$route.params.id].config.ruleset
    ];
  }

  get event() {
    return this.ruleset.events.filter(
      el => el.id === this.$route.params.event
    )[0];
  }

  get participant() {
    let type = this.$store.state.categories[this.$route.params.id].config.type;
    if (type === "team") {
      return this.$store.state.people.teams[this.$route.params.participant];
    } else if (type === "individual") {
      return this.$store.state.people.people[this.$route.params.participant];
    }
    return {
      name: "",
      club: ""
    };
  }

  get judgesArr() {
    return this.$store.state.categories[this.$route.params.id].judges
      .filter(el => !!el[this.$route.params.event])
      .map(el => [el.id, el[this.$route.params.event]]);
  }

  JudgeIsConfigured(judgeID: string = "J"): boolean {
    return judgeID.substring(0, 1) !== "J";
  }

  nextParticipant(participant: string) {
    const participants = this.$store.state.categories[this.$route.params.id]
      .participants;
    const idx = participants.indexOf(participant) + 1;
    if (idx === participants.length) return undefined;
    return participants[idx];
  }

  previousParticipant(participant: string) {
    const participants = this.$store.state.categories[this.$route.params.id]
      .participants;
    const idx = participants.indexOf(participant) - 1;
    if (idx === -1) return undefined;
    return participants[idx];
  }

  memberNames(members: string[]): string {
    return members
      .map(id => this.$store.state.people.people[id].name)
      .join(", ");
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
