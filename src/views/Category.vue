<template>
  <v-card>
    <v-card-title>
      {{ $store.state.categories[$route.params.id].config.name }}
      <v-spacer />
      <v-btn link :to="`/category/${$route.params.id}/config`">Configure</v-btn>
    </v-card-title>
    <v-divider />
    <v-simple-table fixed-header dense>
      <thead>
        <tr>
          <template v-if="$store.state.categories[$route.params.id].config.type === 'team'">
            <th class="text-center">Team Name</th>
            <th class="text-center">Team Members</th>
          </template>
          <th class="text-center" v-else>Name</th>
          <th class="text-center">Club</th>
          <th class="text-center">ID</th>

          <th
            class="text-center"
            v-for="event in $store.state.categories[$route.params.id].config.events"
            :key="`header-${event}`"
            colspan="2"
          >{{ event }}</th>

          <th class="text-center">Checksum</th>
        </tr>
      </thead>

      <tbody>
        <tr class="crosshair">
          <th
            class="text-center"
            v-if="$store.state.categories[$route.params.id].config.type === 'team'"
            colspan="4"
          ></th>
          <th class="text-center" v-else colspan="3"></th>
          <th
            class="text-center"
            colspan="2"
            v-for="event in $store.state.categories[$route.params.id].config.events"
            :key="`header-${event}`"
          >
            <v-btn
              v-if="eventByID(event).multipleEntry"
              text
              link
              :to="`/category/${$route.params.id}/score/${event}`"
              class="caption"
              color="primary"
            >Edit Multiple</v-btn>
          </th>

          <th class="text-center"></th>
        </tr>

        <tr v-for="participant in participants" :key="participant.id" class="crosshair">
          <td>{{ participant.name }}</td>
          <td
            v-if="$store.state.categories[$route.params.id].config.type === 'team'"
            class="caption text-truncate"
            max-width="20em"
          >{{ memberNames(participant.members) }}</td>
          <td>{{ participant.club }}</td>
          <td>{{ participant.id }}</td>

          <template v-for="event in $store.state.categories[$route.params.id].config.events">
            <td :key="`edit-${participant.id}-${event}`" class="text-center">
              <v-btn
                text
                link
                :to="`/category/${$route.params.id}/score/${event}/${participant.id}`"
                :color="scoreColor(event, participant.id)"
              >Edit</v-btn>
            </td>
            <td :key="`checksum-${participant.id}-${event}`" class="cust--monospace text-center">
              <!-- TODO: will be wrong if judge id's differ between systems -->
              {{ hashObject($store.getters['categories/participantScoreObj']({ id: $route.params.id, event: event, participant: participant.id })) }}
            </td>
          </template>

          <td></td>
        </tr>
      </tbody>
    </v-simple-table>
  </v-card>
</template>

<script lang="ts">
import { Component, Props, Vue } from "vue-property-decorator";
import SHA1 from "crypto-js/sha1";
import rulesets, { Rulesets } from "@/rules/score.worker";
import TableHeader from "@/plugins/vuetify";
import { wrap } from "comlink";

@Component
export default class Category<VueClass> extends Vue {
  rulesets = wrap<Rulesets>(rulesets);

  get ruleset() {
    return this.rulesets[
      this.$store.state.categories[this.$route.params.id].config.ruleset
    ];
  }

  eventByID(eventID) {
    return this.ruleset.events.filter(el => el.id === eventID)[0];
  }

  memberNames(members: string[] = []): string {
    return members
      .map(id => this.$store.state.people.people[id].name)
      .join(", ");
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

  scoreColor(event, participant): string {
    let scoreEntry = this.$store.getters["categories/participantScoreObj"]({
      id: this.$route.params.id,
      event,
      participant
    });
    let dns = this.$store.getters["categories/dns"]({
      id: this.$route.params.id,
      event,
      participant
    });
    if (dns) {
      return "grey";
    } else if (Object.keys(scoreEntry).length === 0) {
      return "error";
    } else {
      return "success";
    }
  }

  hashObject(obj = {}, len = 5) {
    let json = JSON.stringify(obj);
    let bytes = SHA1(json);
    let hash = bytes.toString();
    return hash.substring(0, len);
  }
}
</script>

<style scoped>
.cust--monospace {
  font-family: monospace;
  white-space: nowrap;
}

.cust--noborder {
  border-bottom: none !important;
}

th,
td {
  white-space: nowrap;
  padding: 0 4px;
}

th:not(:last-child),
td:not(:last-child) {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

tbody tr th {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
