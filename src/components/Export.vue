<template>
  <div>
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="categories.categoriesWithInfo"
      :sort-by="['group']"
      show-select
      item-key="id"
      disable-pagination
      hide-default-footer
    />

    <v-card-actions>
      <v-btn @click="exportCategories()" color="primary">Export All</v-btn>
      <v-btn :disabled="!selected.length" @click="exportCategories(selected)" color="secondary">Export Selected</v-btn>
    </v-card-actions>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { getModule } from "vuex-module-decorators";
import CategoriesModule, { CategoryWithInfo } from '@/store/categories';
import SystemModule from '@/store/system';
import { TableHeader } from '../plugins/vuetify';
import { nameCleaner } from '../common';
import { DateTime } from 'luxon';

@Component
export default class Export extends Vue {
  categories = getModule(CategoriesModule)
  system = getModule(SystemModule)
  selected: CategoryWithInfo[] = []

  headers: TableHeader[] = [
    {
      text: 'Name',
      value: 'name'
    },
    {
      text: 'Group',
      value: 'group'
    },
    {
      text: 'Ruleset',
      value: 'ruleset'
    }
  ]

  exportCategories (selected?: CategoryWithInfo[]) {
    let ids: string[] | undefined = (selected ?? []).map(selected => selected.id)
    ids = ids.length ? ids : undefined

    const exported = this.categories.export({ ids, computerName: this.system.computerName })

    const a = document.createElement('a')
    a.href = 'data:application/json;base64,' + window.btoa(unescape(encodeURIComponent(JSON.stringify(exported))))
    a.download = `RopeScore-export-${nameCleaner(this.system.computerName)}-${DateTime.local().toFormat("yyMMdd")}.json`

    a.click()
  }
}
</script>

<style scoped>
</style>
