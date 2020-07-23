<template>
  <v-card>
    <v-card-title>
      {{ categories.categories[$route.params.id].config.name }}
      <v-spacer />
      <v-btn link text :to="`/category/${$route.params.id}/config`">Configure</v-btn>
    </v-card-title>
    <v-divider />
    <v-simple-table fixed-header dense>
      <thead>
        <tr>
          <template v-if="categories.categories[$route.params.id].config.type === 'team'">
            <th class="text-center">Team Name</th>
            <th class="text-center">Team Members</th>
          </template>
          <th class="text-center" v-else>Name</th>
          <th class="text-center">Club</th>
          <th class="text-center">ID</th>

          <th
            class="text-center"
            v-for="eventID in categories.categories[$route.params.id].config.events"
            :key="`header-${eventID}`"
            colspan="2"
          >{{ eventID }}</th>

          <th class="text-center">Checksum</th>
        </tr>
      </thead>

      <tbody>
        <tr class="crosshair">
          <th
            class="text-center"
            v-if="categories.categories[$route.params.id].config.type === 'team'"
            colspan="4"
          ></th>
          <th class="text-center" v-else colspan="3"></th>
          <th
            class="text-center"
            colspan="2"
            v-for="eventID in categories.categories[$route.params.id].config.events"
            :key="`header-${eventID}`"
          >
            <v-btn
              v-if="(eventByID(eventID) || {}).multipleEntry"
              text
              link
              :to="`/category/${$route.params.id}/score/${eventID}`"
              class="caption"
              color="primary"
            >Edit Multiple</v-btn>
          </th>

          <th class="text-center"></th>
        </tr>

        <tr
          v-for="participant in categories.categories[$route.params.id].participants"
          :key="participant.participantID"
          class="crosshair"
        >
          <td>{{ participant.name }}</td>
          <td
            v-if="categories.categories[$route.params.id].config.type === 'team'"
            class="caption text-truncate"
            max-width="20em"
          >{{ memberNames(participant) }}</td>
          <td>{{ participant.club }}</td>
          <td>{{ participant.participantID }}</td>

          <template v-for="eventID in categories.categories[$route.params.id].config.events">
            <td :key="`edit-${participant.participantID}-${eventID}`" class="text-center">
              <v-btn
                text
                link
                :to="`/category/${$route.params.id}/score/${eventID}/${participant.participantID}`"
                :color="scoreColor(eventID, participant)"
              >Edit</v-btn>
            </td>
            <td :key="`checksum-${participant.participantID}-${eventID}`" class="cust--monospace text-center">
              <!-- {{ hashObject(categories.participantScoreObj({ id: $route.params.id, eventID, participantID: participant.participantID })) }} -->
            </td>
          </template>

          <td></td>
        </tr>
      </tbody>
    </v-simple-table>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import SHA1 from "crypto-js/sha1";
import rulesets, { Rulesets, Ruleset } from "../rules";
import TableHeader from "../plugins/vuetify";
import CategoriesModule, { Person, TeamPerson } from "../store/categories";
import { getModule } from "vuex-module-decorators";
import { memberNames } from '@/common'

@Component
export default class Category<VueClass> extends Vue {
  rulesets = rulesets;
  categories = getModule(CategoriesModule);
  memberNames = memberNames

  get ruleset() {
    return this.rulesets.find(
      rs =>
        rs.rulesetID ===
        this.categories.categories[this.$route.params.id].config.ruleset
    );
  }

  eventByID(eventID: string) {
    return (this.ruleset?.events as Ruleset['events']).find(el => el.eventID === eventID);
  }

  scoreColor(eventID: string, participant: TeamPerson): string {
    const category = this.categories.categories[this.$route.params.id]
    const dns = category.dns.findIndex(dns => dns.participantID === participant.participantID && dns.eventID === eventID) > -1
    const hasScore = category.scores.findIndex(score => score.participantID === participant.participantID && score.eventID === eventID) > -1

    if (dns) {
      // !hasScore && locked
      return 'grey';
    } else if (hasScore) {
      // return 'primary'
      // else if hasScore && locked
      return 'success';
    } else {
      return 'error'
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
