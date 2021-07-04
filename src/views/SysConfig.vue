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

      <v-dialog v-model="deleteDialog" max-width="500">
        <template v-slot:activator="{ on, attrs }">
          <v-card-actions>
            <v-btn v-bind="attrs" v-on="on" color="error">Delete All Categories</v-btn>
          </v-card-actions>
        </template>
        <v-card>
          <v-card-title>Delete All Categories</v-card-title>
          <v-card-text>
            This will <span class="font-weight-bold">permanently</span> delete all your categories.<br/>
            Before doing this <span class="font-weight-bold">make an export</span>as a backup.<br/>
            Your System settings (such as the system name) will not be deleted.
          </v-card-text>

          <v-card-actions>
            <v-btn color="primary" @click="deleteDialog = false">Cancel</v-btn>
            <v-btn color="error" @click="resetSystem()">Delete All Categories</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>

    <v-card class="mb-4">
      <v-row>
        <v-col cols="12" md="6">
          <v-card-title>Export</v-card-title>
          <Export />
        </v-col>

        <v-col cols="12" md="6">
          <v-card-title>Import</v-card-title>
          <Import />
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
import Import from "@/components/Import/Selector.vue";
import SystemModule from '@/store/system';
import CategoriesModule from '../store/categories';

@Component({
  components: {
    Changelog,
    Export,
    Import
  }
})
export default class SysConfig<VueClass> extends Vue {
  config = getModule(SystemModule)
  categories = getModule(CategoriesModule)
  deleteDialog: boolean = false

  get computerName () {
    return this.config.computerName
  }

  set computerName (newName: string) {
    this.config.setComputerName({ value: newName })
  }

  resetSystem () {
    this.categories.resetStore()
    this.deleteDialog = false
  }
}
</script>
