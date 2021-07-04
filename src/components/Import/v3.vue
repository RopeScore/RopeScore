<template>
  <div>
    <v-card-text>
      <span v-if="parsed">
        Loaded Export made in RopeScore v{{ parsed.version }} on {{ parsed.exportedAt | unixToDate }} <span v-if="parsed.computerName">by "{{ parsed.computerName }}"</span>
      </span>

      <v-data-table
        v-if="parsed"
        v-model="selected"
        :headers="headers"
        :items="parsedInfo"
        :sort-by="['group']"
        show-select
        item-key="id"
        disable-pagination
        hide-default-footer
      >
        <template v-slot:item.collision="{ item }">
          <v-chip v-if="item.collision" color="warning">Existing category will be overwritten</v-chip>
        </template>
      </v-data-table>
    </v-card-text>

    <v-card-actions v-if="parsed">
      <v-btn color="primary" :disabled="!selected.length" @click="importCategories(parsed, selected)" :loading="importing">Import Selected</v-btn>
    </v-card-actions>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator"
import { getModule } from "vuex-module-decorators"
import CategoriesModule, { CategoryWithInfo, Categories, Export } from '@/store/categories'
import { valid as semverValid, satisfies as semverSatisfies, gt as semverGt } from 'semver'
import { version as packageVersion } from '../../../package.json'
import { DateTime } from 'luxon'
import { TableHeader } from '@/plugins/vuetify'
import { getInfoFromCategories } from '@/common'

type CategoryWithInfoAndCollision = CategoryWithInfo & { collision: boolean }

@Component({
  filters: {
    unixToDate: (value?: number) => value ? DateTime.fromSeconds(value).toLocaleString(DateTime.DATETIME_MED) : ''
  }
})
export default class v3 extends Vue {
  @Prop({ required: true }) parsed: Export | null
  @Prop() loading: boolean
  importing: boolean = false

  categories = getModule(CategoriesModule)
  parsedInfo: CategoryWithInfoAndCollision[] = []
  selected: CategoryWithInfoAndCollision[] = []

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
    },
    {
      text: 'Collision Handling',
      value: 'collision'
    }
  ]

  @Watch('parsed')
  onParsed (parsed: Export | null) {
    if (!parsed) return

    if (
      !Object.prototype.hasOwnProperty.call(parsed, 'version') ||
      typeof parsed.version !== 'string' ||
      !Object.prototype.hasOwnProperty.call(parsed, 'categories') ||
      typeof parsed.categories !== 'object' ||
      !semverValid(parsed.version) ||
      !semverSatisfies(parsed.version, `3.x <=${packageVersion}`)
    ) {
      this.$emit('error', semverValid(parsed.version) && semverGt(parsed.version, packageVersion)
        ? 'The file you selected seem to be made in a newer version of RopeScore'
        : 'The file you selected does not seem to be a RopeScore v3 export file'
      )
      return
    }

    const withInfo = this.getCategoriesWithInfo(parsed)
    this.$set(this, 'parsedInfo', withInfo)
    this.$set(this, 'selected', withInfo)
  }

  getCategoriesWithInfo (parsed: Export | null): CategoryWithInfoAndCollision[] {
    if (!parsed) return []

    const withInfo = getInfoFromCategories(parsed.categories)

    return withInfo.map(info => ({
      ...info,
      collision: this.categories.hasCategory(info.id)
    }))
  }

  importCategories (parsed: Export | null, selected: CategoryWithInfoAndCollision[]) {
    if (!parsed || !selected || !selected.length) return
    this.importing = true

    for (const selection of selected) {
      // TODO: migrate
      this.categories._importCategory({ id: selection.id, value: parsed.categories[selection.id] })
    }

    this.importing = false
    this.$emit('success')
  }
}
</script>

<style scoped>
</style>
