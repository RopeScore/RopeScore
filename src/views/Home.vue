<template>
  <v-expansion-panels multiple v-model="open">
    <v-expansion-panel
      v-for="group in $store.getters['categories/groupedCategories']"
      :key="group.name"
    >
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
              <v-card-text>{{ (rulesets[category.ruleset] || {}).name }}</v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { Component, Props, Vue } from "vue-property-decorator";
import rulesets, { Rulesets } from "@/rules/score.worker";
import { wrap } from "comlink";

@Component
export default class Home<VueClass> extends Vue {
  rulesets = wrap<Rulesets>(rulesets);
  open: number[] = this.$store.getters["categories/groupedCategories"].map(
    (el, idx) => idx
  );
}
</script>
