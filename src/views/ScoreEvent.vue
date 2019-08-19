<template>
  <v-container fluid>
    <v-toolbar class="cust--floating">
      <v-toolbar-title>
        <span>{{ $store.state.categories[$route.params.id].config.name }}</span>
        <br />
        <span class="font-weight-bold">{{ event.name }}</span>&nbsp;
      </v-toolbar-title>
      <v-spacer />
      <v-toolbar-items>
        <v-btn link text :to="`/category/${$route.params.id}`" exact class="mr-2">Return</v-btn>
        <!-- <v-btn
          @click="$store.dispatch('categories/toggleDNS', { id: $route.params.id, event: $route.params.event, participant: participant.id })"
          class="mr-2"
          text
          :color="$store.getters['categories/dns']({ id: $route.params.id, event: $route.params.event, participant: participant.id }) ? 'error' : ''"
        >Did {{ $store.getters['categories/dns']({ id: $route.params.id, event: $route.params.event, participant: participant.id }) ? '' : 'Not' }} Skip</v-btn>-->
      </v-toolbar-items>
    </v-toolbar>
    <div class="pt-12 mt-12">
      <v-card>
        <v-simple-table fixed-header dense>
          <thead>
            <tr>
              <template v-if="$store.state.categories[$route.params.id].config.type === 'team'">
                <th>Team Name</th>
                <th>Team Members</th>
              </template>
              <th v-else>Name</th>
              <th>Club</th>
              <th>ID</th>

              <!-- <th

              v-for="event in $store.state.categories[$route.params.id].config.events"
              :key="`header-${event}`"
              colspan="2"
              >{{ event }}</th>-->
              <template v-for="judgeType in event.judges">
                <th
                  v-for="judge in $store.state.categories[$route.params.id].judges"
                  v-if="judge[event.id] === judgeType.id"
                  :key="`header-${judgeType.id}-${judge.id}`"
                  :colspan="judgeType.fields.length"
                  class="text-center"
                >{{ judge.id }}</th>
              </template>

              <th>Score</th>
              <th>DNS</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="participant in participants" :key="participant.id" class="crosshair">
              <td>{{ participant.name }}</td>
              <td
                v-if="$store.state.categories[$route.params.id].config.type === 'team'"
                class="caption text-truncate"
                max-width="20em"
              >{{ memberNames(participant.members) }}</td>
              <td>{{ participant.culb }}</td>
              <td>{{ participant.id }}</td>

              <template v-for="judgeType in event.judges">
                <template
                  v-for="judge in $store.state.categories[$route.params.id].judges"
                  v-if="judge[event.id] === judgeType.id"
                >
                  <td
                    v-for="field in judgeType.fields"
                    :key="`entry-${participant.id}-${judgeType.id}-${judge.id}-${field.id}`"
                    class="cust--narrow"
                  >
                    <!-- TODO: cap to max and apply style if enters above that? -->
                    <v-text-field
                      type="number"
                      :label="field.name"
                      :min="field.min"
                      :max="field.max"
                      :step="field.step || 1"
                      :value="$store.getters['categories/fieldScore']({ id: $route.params.id, event: $route.params.event, participant: participant.id, judgeID: judge.id, field: field.id})"
                      @input="$store.dispatch('categories/setScore', { id: $route.params.id, event: $route.params.event, participant: participant.id, judgeID: judge.id, field: field.id, value: $event, min: field.min, max: field.max, step: field.step })"
                      v-if="judgeIsConfigured(judge.id) && !$store.getters['categories/dns']({ id: $route.params.id, event: $route.params.event, participant: participant.id })"
                    />
                    <!-- TODO: checkbox -->
                  </td>
                </template>
              </template>

              <!-- TODO: autodecide which value to show -->
              <td>{{ event.result($store.getters['categories/participantScoreObj']({ id: $route.params.id, event: $route.params.event, participant: participant.id }), judgesArr) }}</td>
              <td>
                <v-btn
                  @click="$store.dispatch('categories/toggleDNS', { id: $route.params.id, event: $route.params.event, participant: participant.id })"
                  class="mr-2"
                  text
                  :color="$store.getters['categories/dns']({ id: $route.params.id, event: $route.params.event, participant: participant.id }) ? 'error' : ''"
                >D{{ $store.getters['categories/dns']({ id: $route.params.id, event: $route.params.event, participant: participant.id }) ? '' : 'N' }}S</v-btn>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Props, Vue } from "vue-property-decorator";
import rulesets from "@/rules";
// import TableHeader from '@/plugins/vuetify';

@Component
export default class ScoreParticipant<VueClass> extends Vue {
  rulesets = rulesets;

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

  get participants() {
    if (
      this.$store.state.categories[this.$route.params.id].config.type ===
      "individual"
    ) {
      return this.$store.state.categories[
        this.$route.params.id
      ].participants.map(id => ({
        id,
        ...this.$store.state.people.people[id]
      }));
    } else if (
      this.$store.state.categories[this.$route.params.id].config.type === "team"
    ) {
      return this.$store.state.categories[
        this.$route.params.id
      ].participants.map(id => ({
        id,
        ...this.$store.state.people.teams[id]
      }));
    }
  }

  get judgesArr() {
    return this.$store.state.categories[this.$route.params.id].judges
      .filter(el => !!el[this.$route.params.event])
      .map(el => [el.id, el[this.$route.params.event]]);
  }

  judgeIsConfigured(judgeID: string = "J"): boolean {
    return judgeID.substring(0, 1) !== "J";
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

.cust--narrow {
  max-width: 5em;
}
</style>
