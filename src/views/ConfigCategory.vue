<template>
  <v-stepper v-model="step" vertical>
    <v-stepper-step :complete="step > 1" step="1" :editable="step > 1">Basics</v-stepper-step>
    <v-stepper-content step="1">
      <v-form ref="basicsForm" @submit.prevent="stepper('basicsForm',)">
        <v-text-field
          label="Category Name"
          :rules="[notEmpty]"
          required
          :value="$store.state.categories[id].config.name"
          @input="$store.commit('categories/setName', {id, name: $event})"
        />
        <v-combobox
          label="Category Group"
          clearable
          :value="$store.state.categories[id].config.group"
          @input="$store.commit('categories/setGroup', {id, group: $event})"
          :items="$store.getters['categories/groups']"
        >
          <template v-slot:prepend-item>
            <v-list-item>
              <v-list-item-subtitle>Select a group from the list below, or create one by entering a new name</v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-combobox>
        <v-select
          label="Rules"
          :items="rulesetArray"
          item-text="name"
          item-value="id"
          item-disabled="disabled"
          :rules="[notEmpty]"
          clearable
          @change="rulesetChanged"
          required
          class="mb-6"
          :value="$store.state.categories[id].config.ruleset"
          @input="$store.commit('categories/setRuleset', {id, ruleset: $event})"
        />
        <v-btn color="primary" type="submit">Continue</v-btn>
        <!-- <v-btn text>Back</v-btn> -->
      </v-form>
    </v-stepper-content>

    <v-stepper-step :complete="step > 2" step="2" :editable="step > 2">Events</v-stepper-step>
    <v-stepper-content step="2">
      <v-form ref="eventsForm" @submit.prevent="stepper('eventsForm')">
        <v-container v-if="ruleset">
          <v-switch
            v-for="event in ruleset.events"
            :key="event.id"
            :label="event.name"
            :value="event.name"
          />
        </v-container>
        <v-btn color="primary" type="submit">Continue</v-btn>
        <v-btn text @click="step -= 1">Back</v-btn>
      </v-form>
    </v-stepper-content>

    <v-stepper-step :complete="step > 3" step="3" :editable="step > 3">Judges</v-stepper-step>
    <v-stepper-content step="3" />

    <v-stepper-step :complete="step > 4" step="4" :editable="step > 4">Participants</v-stepper-step>
    <v-stepper-content step="4" />
  </v-stepper>
</template>

<script lang="ts">
import { Component, Props, Vue } from 'vue-property-decorator';
import rulesets from '@/rules';

@Component
export default class ConfigCategory<VueClass> extends Vue {
  id: string;
  step: number = 1;
  ruleset: any = null;
  rulesets = rulesets;
  // requireRulesets: any = require.context('@/rules', true, /.*\.ts$/);
  // rulesets: any = this.requireRulesets.keys().map(fileName => {
  //   const ruleset = this.requireRulesets(fileName)
  //   return ruleset.default || ruleset
  // });

  created () {
    this.id = this.$route.params.id
  }

  notEmpty = (v: string): string | boolean => !!v || 'This cannot be empty';

  get rulesetArray () {
    return Object.keys(this.rulesets).map(id => ({
      id,
      name: this.rulesets[id].name
    }))
  }

  rulesetChanged (selectedID): void {
    console.log(selectedID)
    if (!this.rulesets[selectedID]) return

    this.ruleset = this.rulesets[selectedID]
    console.log(this.ruleset)
  }

  stepper (form) {
    if (this.$refs[form].validate()) {
      switch (form) {
        case 'basicsForm':
          console.log(this.$route)

          this.$store.dispatch('categories/setBasics', {
            id: this.id,
            name: '',
            group: '',
            ruleset: ''
          })
          console.log(this.$store.state)
          break;
      }
      this.step += 1
    }
  }
}
</script>
