<template>
  <div>
    <v-btn text v-if="cat.length > 0" :to="`/category/${cat}/results`" class="mr-2" exact>Results</v-btn>
    <v-btn text v-if="cat.length > 0" :to="`/category/${cat}`" class="mr-2" exact>Category</v-btn>
    <v-btn text v-if="cat.length == 0" to="/new" class="mr-2" exact>New Category</v-btn>
    <v-btn text to="/system" class="mr-2" exact>System</v-btn>
    <v-btn text to="/" class="mr-2" exact>Dashboard</v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class Menu<VueClass> extends Vue {
  @Prop() private cat: string;
}
</script>
