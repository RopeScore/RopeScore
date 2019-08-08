<template>
  <div>
    <v-btn text v-if="cat.length > 0" :to="`/category/${cat}/results`">
      <span class="mr-2">Results</span>
    </v-btn>
    <v-btn text v-if="cat.length > 0" :to="`/category/${cat}`">
      <span class="mr-2">Category</span>
    </v-btn>
    <v-btn text to="/new">
      <span class="mr-2">New Category</span>
    </v-btn>
    <v-btn text to="/people">
      <span class="mr-2">People</span>
    </v-btn>
    <v-btn text to="/">
      <span class="mr-2">Dashboard</span>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Menu<VueClass> extends Vue {
  @Prop() private cat: string;
}
</script>
