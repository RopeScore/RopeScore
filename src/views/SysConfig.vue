<template>
  <v-container fluid>
    <v-card class="mb-4">
      <v-card-title>System</v-card-title>
      <v-card-text>
        <v-text-field
          label="Computer Name"
          :value="$store.state.system.computerName"
          @input="$store.commit('system/setComputerName', { value: $event })"
        />
      </v-card-text>
    </v-card>
    <Changelog class="mb-4" />
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import Changelog from "@/components/Changelog.vue";

@Component({
  components: { Changelog }
})
export default class SysConfig<VueClass> extends Vue {}
</script>
