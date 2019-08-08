<template>
  <v-container fluid>
    <PeopleTable class="mb-6" />
    <TeamsTable />
  </v-container>
</template>

<script lang="ts">
import { Component, Props, Vue } from 'vue-property-decorator';
import PeopleTable from '@/components/PeopleTable';
import TeamsTable from '@/components/TeamsTable';

@Component({
  components: {
    PeopleTable,
    TeamsTable
  }
})
export default class People<VueClass> extends Vue {}
</script>
