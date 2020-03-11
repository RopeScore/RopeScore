<template>
  <v-card class="page" :class="{ 'cust--noprint': exclude }">
    <v-card-text class="text-right cust--float cust--top cust--tiny" v-if="logo">
      <img :src="logo" class="cust--page-logo" />
    </v-card-text>
    <v-card-title class="pr-12 mr-12">
      {{ category }}
      <v-spacer />
      <v-btn text @click="changeZoom(-0.03)" class="cust--noprint">Zoom -</v-btn>
      <v-btn text @click="changeZoom()" class="cust--noprint">Reset Zoom</v-btn>
      <v-btn text @click="changeZoom(0.03)" class="cust--noprint">Zoom +</v-btn>
      <v-btn
        text
        :color="exclude ? 'error' : ''"
        @click="togglePrint"
        class="cust--noprint"
      >{{ exclude ? 'Include' : 'Exclude' }}</v-btn>
    </v-card-title>
    <v-card-text class="title">{{ title }}</v-card-text>
    <v-card-text class="text-right cust--float cust--bottom cust--tiny">
      Scores from RopeScore v{{ version }} -
      <a>ropescore.com</a>
    </v-card-text>
    <div class="cust--table__wrapper">
      <table class="cust--pa-4-notprint">
        <thead>
          <tr v-for="(row, idx) in headers.groups" :key="`row-${idx}`">
            <th v-if="idx === 0 && type === 'team'" colspan="4" :rowspan="headers.groups.length"></th>
            <th v-else-if="idx === 0" colspan="3" :rowspan="headers.groups.length"></th>

            <th
              v-for="(group, gIdx) in row"
              :key="`row-${idx}-${gIdx}`"
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
              :key="`${header.eventID}-${header.value}`"
              :class="classColorObj(header.color)"
            >{{ header.text }}</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="result in ((results || {}).overall || results)" :key="result.participantID">
            <template v-if="type === 'team'">
              <td class="black--text">{{ getParticipant(result.participantID).name }}</td>
              <td class="black--text caption">{{ memberNames(getParticipant(result.participantID)) }}</td>
              <td class="black--text">{{ getParticipant(result.participantID).club }}</td>
            </template>
            <template v-else>
              <td class="black--text">{{ getParticipant(result.participantID).name }}</td>
              <td class="black--text">{{ getParticipant(result.participantID).club }}</td>
            </template>
            <td class="black--text text-right">{{ result.participantID }}</td>

            <td
              v-for="header in headers.headers"
              :key="`${result.participantID}-${header.eventID || title}-${header.value}`"
              class="text-right"
              :class="classColorObj(header.color)"
            >{{ getScore(result, header.value, header.eventID) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch, Emit } from 'vue-property-decorator';
import { getModule } from "vuex-module-decorators";
import {
  ResultTableHeaders,
  ResultTableHeaderGroup,
  ResultTableHeader
} from '@/rules';
import CategoriesModule, { TeamPerson, Team } from '@/store/categories';
import { ResultsObj } from '../views/CategoryResults.vue';
import { memberNames } from '@/common'

@Component
export default class ResultTable<VueClass> extends Vue {
  @Prop({ default: '' }) private title: string;
  @Prop({ default: '' }) private category: string;
  @Prop({ default: 'individual' }) private type: string;
  @Prop({ default: 1 }) private zoom: number;
  @Prop({ default: '' }) private logo: string;
  @Prop({ default: false }) private exclude: boolean;
  @Prop({ default: () => {} }) private headers: ResultTableHeaders;
  @Prop({ default: () => {} }) private results: ResultsObj;
  @Prop({ default: () => {} }) private participants: TeamPerson[];

  version: string = require('@/../package.json').version;
  categories = getModule(CategoriesModule)
  memberNames = memberNames

  @Emit('printchange')
  togglePrint () {
    return true
  }

  classColorObj (color: string = 'black'): { [cssClass: string]: boolean } {
    return {
      [`${color}--text`]: true
    }
  }

  getParticipant(participantID: string) {
    return this.participants.find(part => part.participantID === participantID) || {}
  }

  getScore (result: any, value: string, event?: string) {
    if (event) {
      return this.results[event].find(
        el => result.participantID === el.participantID
      )?.[value]
    } else {
      return result[value]
    }
  }

  @Emit('zoomchange')
  changeZoom (change: number): number {
    let changed = this.zoom + change
    if (!change) changed = 1;
    (this.$el as any).style.setProperty(
      '--page-zoom',
      `${Math.round(changed * 100)}%`
    )
    return changed
  }

  mounted (): void {
    if (!(this.$el as any).style) return;
    (this.$el as any).style.setProperty(
      '--page-zoom',
      `${Math.round(this.zoom * 100)}%`
    )
  }
}
</script>

<style scoped>
.v-card {
  margin-bottom: 24px;
  --page-zoom: 100%;
}

.cust--table__wrapper {
  overflow-x: auto;
  padding: 16px;
}

.cust--float {
  position: absolute;
}

.cust--top {
  top: 0;
}

.cust--bottom {
  bottom: 0;
}

.cust--tiny {
  font-size: 70%;
}

.cust--page-logo {
  height: 70px;
}

.page div:not(.cust--noprint) {
  zoom: var(--page-zoom);
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
  .cust--noprint {
    display: none;
  }
}
</style>
