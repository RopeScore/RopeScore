<template>
  <v-card>
    <v-card-title>
      {{ $store.state.categories[$route.params.id].config.name }}
      <v-spacer />
      <v-btn link :to="`/category/${$route.params.id}/config`">Configure</v-btn>
    </v-card-title>
  </v-card>
</template>

<script lang="ts">
import { Component, Props, Vue } from 'vue-property-decorator';
import rulesets from '@/rules';

@Component
export default class Category<VueClass> extends Vue {
  rulesets = rulesets;
}
</script>
