<template>
  <div>
    <v-tabs
      v-model="tab"
    >
      <v-tab>RopeScore v3</v-tab>
      <v-tab disabled>RopeScore v2</v-tab>
      <v-tab disabled>IJRU Registration</v-tab>
    </v-tabs>

    <v-card-text>
      <v-alert type="error" dismissible @input="clearError" :value="!!error">
        {{ error }}
      </v-alert>

      <v-alert type="success" dismissible v-model="success">
        Import Succeeded
      </v-alert>

      <v-file-input @change="onFileSelected" v-model="selectedFile" clearable placeholder="Click to Open an Export File" label="Export File" :truncate-length="50" accept=".json,application/json" :loading="loading" />
    </v-card-text>

    <v-tabs-items v-model="tab">
      <v-tab-item>
        <v3
          :parsed="parsed"
          :loading="loading"
          @error="onError"
          @success="onSuccess"
        />
      </v-tab-item>

      <v-tab-item>
        RS v2
      </v-tab-item>

      <v-tab-item>
        IJRU
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator"
import v3 from './v3.vue'
import { Export } from '../../store/categories'

@Component({
  components: {
    v3
  }
})
export default class Import extends Vue {
  tab: number = 0
  parsed: Export | null = null
  loading: boolean = false
  error: string | null = null
  success: boolean = false
  selectedFile: File | null = null

  clearError () {
    this.error = null
  }

  onError (error: string) {
    this.clear()
    this.error = error
  }

  onSuccess () {
    this.clear()
    this.success = true
    this.selectedFile = null
  }

  clear () {
    this.$set(this, 'parsed', null)
    this.loading = false
    this.success = false
    this.error = null
  }

  onFileSelected (file: File) {
    if (!file) return this.clear()

    this.loading = true
    const reader = new FileReader()

    reader.onload = event => {
      try {
        const result = JSON.parse(event.target?.result as string)

        this.$set(this, 'parsed', result)
        this.loading = false
      } catch (err) {
        this.onError('Incorrect file type')
      }
    }

    reader.onerror = event => {
      this.onError('Error loading file')
    }

    reader.readAsText(file)
  }
}
</script>
