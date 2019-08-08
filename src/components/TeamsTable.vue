<template>
  <v-card>
    <v-card-title>
      Teams
      <v-spacer></v-spacer>
      <v-text-field v-model="search" label="Search" single-line hide-details></v-text-field>
      <!-- append-icon="search" -->
    </v-card-title>
    <v-data-table :headers="headers" :items="items" :search="search"></v-data-table>
  </v-card>
</template>

<script lang="ts">
import { Component, Props, Vue } from 'vue-property-decorator';

interface TableHeader {
  text: string;
  value: string;
  align?: 'start' | 'center' | 'end';
  sortable?: boolean;
  divider?: boolean;
  class?: string | string[];
  width?: string | number;
  filter?: (value: any, search: string, item: any) => boolean;
  sort?: (a: any, b: any) => number;
}

@Component
export default class TeamsTable<VueClass> extends Vue {
  search: string = '';
  headers: TableHeader[] = [
    {
      text: 'ID',
      value: 'id',
      align: 'end'
    },
    {
      text: 'Name',
      value: 'name'
    },
    {
      text: 'Members',
      value: 'members'
    },
    {
      text: 'Club',
      value: 'club'
    },
    {
      text: 'Nationality',
      value: 'country'
    },
    {
      text: 'IJRU ID',
      value: 'ijru',
      align: 'end'
    }
  ];
  items = [
    {
      id: 100,
      name: 'Svante Bengtson',
      members: ['P100RS', 'P101RS']
    },
    {
      id: 101,
      name: 'Bert Bertsson'
    }
  ];
}
</script>
