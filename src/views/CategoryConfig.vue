<template>
  <v-stepper v-model="step" vertical>
    <v-stepper-step :complete="step > 1" step="1" :editable="step > 1">Basics</v-stepper-step>
    <v-stepper-content step="1">
      <v-form ref="basicsForm" @submit.prevent="step = 2">
        <v-text-field
          label="Category Name"
          :rules="[notEmpty]"
          required
          :value="$store.state.categories[id].config.name"
          @input="$store.commit('categories/setCategoryName', {id, value: $event})"
        />
        <v-combobox
          label="Category Group"
          clearable
          :value="$store.state.categories[id].config.group"
          @input="$store.commit('categories/setCategoryGroup', {id, value: $event})"
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
          @input="$store.commit('categories/setCategoryRuleset', {id, value: $event})"
        />
        <v-radio-group
          :value="$store.state.categories[id].config.type"
          @change="$store.commit('categories/setCategoryType', { id, value: $event })"
          class="pl-2"
        >
          <v-radio label="Individual Competition" value="individual" />
          <v-radio label="Team Competition" value="team" />
        </v-radio-group>
        <v-btn color="primary" type="submit">Continue</v-btn>
        <!-- <v-btn text>Back</v-btn> -->
      </v-form>
    </v-stepper-content>

    <v-stepper-step :complete="step > 2" step="2" :editable="step > 2">Events</v-stepper-step>
    <v-stepper-content step="2">
      <v-form ref="eventsForm" @submit.prevent="step = 3">
        <v-container v-if="ruleset">
          <v-switch
            v-for="event in ruleset.events"
            :key="event.id"
            :label="`${event.name} (${event.id.toUpperCase()})`"
            :value="event.id"
            v-model="events"
          />
        </v-container>
        <v-btn color="primary" type="submit">Continue</v-btn>
        <v-btn text @click="step = 1">Back</v-btn>
      </v-form>
    </v-stepper-content>

    <v-stepper-step :complete="step > 3" step="3" :editable="step > 3">Participants</v-stepper-step>
    <v-stepper-content step="3">
      <PeopleTable
        show-select
        @input="updateParticipants"
        class="mb-4"
        :flat="true"
        v-if="$store.state.categories[id].config.type === 'individual'"
      />
      <TeamsTable
        show-select
        @input="updateParticipants"
        class="mb-4"
        :flat="true"
        v-else-if="$store.state.categories[id].config.participants === 'team'"
      />
      <v-btn color="primary" @click="step = 4">Continue</v-btn>
      <v-btn text @click="step = 2">Back</v-btn>
    </v-stepper-content>

    <v-stepper-step :complete="step > 4" step="4" :editable="step > 4">Judges</v-stepper-step>
    <v-stepper-content step="4">
      <!-- <PeopleTable
        show-select
        @input="updateJudges"
        class="mb-4"
        :flat="true"
        v-if="$store.state.categories[id].config.type === 'individual'"
      />-->
      <v-card flat>
        <v-card-title>
          <v-spacer />
          <v-btn
            color="primary"
            dark
            class="mb-2"
            @click="$store.dispatch('categories/addJudge', { id })"
          >Add Judge</v-btn>
        </v-card-title>

        <v-data-table :headers="judgeTableHeaders" :items="$store.state.categories[id].judges">
          <template
            v-slot:item.name="{ item }"
          >{{ ($store.state.people.people[item.id] || {}).name }}</template>

          <template v-slot:item.action="{ item }">
            <v-btn small class="mr-2" @click="editJudge(item)">Edit</v-btn>
            <v-btn
              small
              color="error"
              @click="$store.dispatch('categories/deleteJudge', { id, judgeID: item.id })"
            >Delete</v-btn>
          </template>
        </v-data-table>
      </v-card>
      <v-btn link to="../">Continue</v-btn>
      <v-btn text @click="step = 3">Back</v-btn>
    </v-stepper-content>
  </v-stepper>
</template>

<script lang="ts">
import { Component, Props, Vue } from "vue-property-decorator";
import rulesets from "@/rules";
import PeopleTable from "@/components/PeopleTable";
import TeamsTable from "@/components/TeamsTable";

@Component({
  components: {
    PeopleTable,
    TeamsTable
  }
})
export default class CategoryConfig<VueClass> extends Vue {
  id: string;
  step: number = 4;
  rulesets = rulesets;

  created() {
    this.id = this.$route.params.id;
  }

  notEmpty = (v: string): string | boolean => !!v || "This cannot be empty";

  get rulesetArray() {
    return Object.keys(this.rulesets).map(id => ({
      id,
      name: this.rulesets[id].name
    }));
  }

  get ruleset() {
    if (!this.$store.state.categories[this.id].config.ruleset) return;

    return this.rulesets[this.$store.state.categories[this.id].config.ruleset];
  }

  rulesetChanged(selectedID): void {
    console.log(selectedID);
    if (!this.rulesets[selectedID]) return;

    this.ruleset = this.rulesets[selectedID];
    console.log(this.ruleset);
  }

  get events() {
    return this.$store.state.categories[this.id].config.events || [];
  }

  set events(arr) {
    console.log(arr);
    this.$store.dispatch("categories/updateEvents", {
      id: this.id,
      events: arr
    });
  }

  get judgeTableHeaders() {
    let begining = [
      {
        text: "ID",
        value: "id",
        align: "end"
      },
      {
        text: "Name",
        value: "name"
      }
    ];
    let end = [
      { text: "Actions", value: "action", sortable: false, align: "end" }
    ];

    let judges = this.ruleset.events.map(el => ({
      text: el.id.toUpperCase(),
      value: el.id,
      align: "center"
    }));

    return begining.concat(judges).concat(end);
  }

  eventByID(eventID) {
    return this.ruleset.events.filter(el => el.id === eventID)[0];
  }

  updateParticipants(arr) {
    console.log(arr);
  }
}
</script>
