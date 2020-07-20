<template>
  <v-container fluid>
    <v-card class="mb-4">
      <v-card-title>System</v-card-title>
      <v-card-text>
        <v-text-field
          label="Computer Name"
          :value="computerName"
          @input="computerName = $event"
        />
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-row>
        <v-col cols="12" md="6">
          <v-card-title>Export</v-card-title>

          <Export />
        </v-col>

        <v-col cols="12" md="6">
          <v-card-title>Import</v-card-title>
        </v-col>
      </v-row>
    </v-card>

    <Changelog class="mb-4" />
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { getModule } from "vuex-module-decorators";
import Changelog from "@/components/Changelog.vue";
import Export from "@/components/Export.vue";
import SystemModule from '@/store/system';

@Component({
  components: {
    Changelog,
    Export
  }
})
export default class SysConfig<VueClass> extends Vue {
  config = getModule(SystemModule)

  get computerName () {
    return this.config.computerName
  }

  set computerName (newName: string) {
    this.config.setComputerName({ value: newName })
  }
}
</script>
