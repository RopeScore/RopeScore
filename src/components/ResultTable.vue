<template>
  <v-card class="page">
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text class="text-right">
      Scores from RopeScore -
      <a>ropescore.com</a>
    </v-card-text>
    <div class="cust--table__wrapper">
      <table class="cust--pa-4-notprint">
        <thead>
          <tr v-for="(row, idx) in headers.groups" :key="`row-${idx}`">
            <th v-if="idx === 0 && type === 'team'" colspan="4" :rowspan="headers.groups.length"></th>
            <th v-else-if="idx === 0" colspan="3" :rowspan="headers.groups.length"></th>

            <th
              v-for="group in row"
              :key="`row-${idx}-${group.text}`"
              :colspan="group.colspan"
              :rowspan="group.rowspan"
            >{{ group.text }}</th>
          </tr>
          <tr>
            <template v-if="type === 'team'">
              <th class="black--text">Team Name</th>
              <th class="black--text">Team Members</th>
            </template>
            <th class="black--text" v-else>Name</th>
            <th class="black--text">Club</th>
            <th class="black--text">ID</th>

            <th
              v-for="header in headers.headers"
              :key="`${header.event}-${header.value}`"
              :class="classColorObj(header.color)"
            >{{ header.text }}</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="result in (results.overall || results)" :key="result.participant">
            <template v-if="type === 'team'">
              <td class="black--text">{{ teams[result.participant].name }}</td>
              <td class="black--text caption">{{ memberNames(teams[result.participant].members) }}</td>
              <td class="black--text">{{ teams[result.participant].club }}</td>
            </template>
            <template v-else>
              <td class="black--text">{{ people[result.participant].name }}</td>
              <td class="black--text">{{ people[result.participant].club }}</td>
            </template>
            <td class="black--text text-right">{{ result.participant }}</td>

            <td
              v-for="header in headers.headers"
              :key="`${result.participant}-${header.event}-${header.value}`"
              class="text-right"
              :class="classColorObj(header.color)"
            >{{ getScore(result, header.value, header.event) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class ResultTable<VueClass> extends Vue {
  @Prop({ default: "Results" }) private title: string;
  @Prop({ default: "individual" }) private type: string;
  @Prop({ default: () => [] }) private headers;
  @Prop({ default: () => {} }) private results;
  @Prop({ default: () => {} }) private people;
  @Prop({ default: () => {} }) private teams;

  get hasGroups() {
    return this.headers.groups.map(group => group.text).filter(name => !!name)
      .length;
  }

  classColorObj(color: string = "black") {
    return {
      [`${color}--text`]: true
    };
  }

  memberNames(members: string[]): string {
    return members.map(id => this.people[id].name).join(", ");
  }

  getScore(result, value: string, event?: string) {
    if (event) {
      return this.results[event].find(
        el => result.participant === el.participant
      )[value];
    } else {
      return result[value];
    }
  }
}
</script>

<style scoped>
.v-card {
  margin-bottom: 24px;
}

.cust--table__wrapper {
  overflow-x: auto;
  padding: 16px;
}

table {
  border-collapse: collapse;
}

td,
th {
  border: 1px solid #000 !important;
  padding: 0.2em;
}

tr:nth-child(even) td {
  background-color: #eee;
}

.cust--pa-4-notprint {
  padding: 16px;
}

@media print {
  .cust--pa-4-notprint {
    padding: 0;
  }
}
</style>
