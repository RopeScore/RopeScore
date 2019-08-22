<template>
  <v-card>
    <v-card-title>System</v-card-title>
    <v-card-text>
      <v-text-field
        label="Computer Name"
        :value="$store.state.system.computerName"
        @input="$store.commit('system/setComputerName', { value: $event })"
      />
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class SysConfig<VueClass> extends Vue {}
</script>
