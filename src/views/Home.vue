<template>
  <v-expansion-panels multiple v-model="open" v-if="categories.groupedCategories.length">
    <v-expansion-panel v-for="group in categories.groupedCategories" :key="group.name">
      <v-expansion-panel-header>{{ group.name }}</v-expansion-panel-header>

      <v-expansion-panel-content>
        <v-layout justify-space-between wrap>
          <v-flex
            v-for="category in group.categories"
            :key="`${group.name} - ${category.id}`"
            xs12
            md4
            pa-2
          >
            <v-card link :to="`/category/${category.id}`" elevation="0" color="grey lighten-2">
              <v-card-title>{{ category.name }}</v-card-title>
              <v-card-text>{{ (rulesets.find(rs => rs.rulesetID === category.ruleset) || {}).name }}</v-card-text>
            </v-card>
          </v-flex>
        </v-layout>

        <v-card-actions>
          <v-spacer />
          <v-btn link :to="`/group/${urlSafe(group.name)}/results`">Group Results</v-btn>
        </v-card-actions>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
  <v-card v-else>
    <v-card-title>No Categories</v-card-title>
    <v-card-actions>
      <v-btn text link to="/new" color="primary">New Category</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import rulesets, { Rulesets } from "../rules";
import CategoriesModule from "../store/categories";
import { getModule } from "vuex-module-decorators";

@Component
export default class Home extends Vue {
  rulesets = rulesets;
  categories = getModule(CategoriesModule);

  open: number[] = this.categories.groupedCategories.map((el, idx) => idx);

  urlSafe (value: string) {
    return encodeURIComponent(btoa(value))
  }
}
</script>
