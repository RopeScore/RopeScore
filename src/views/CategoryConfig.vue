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
        <v-btn color="primary" type="submit" class="mr-2">Continue</v-btn>
        <!-- <v-btn text class="mr-2">Back</v-btn> -->
        <v-btn color="error" class="mr-2" @click="deleteCategoryDialog = true" e>Delete</v-btn>
      </v-form>
    </v-stepper-content>

    <v-dialog v-model="deleteCategoryDialog" max-width="500px" :retain-focus="false">
      <v-card>
        <v-card-title>
          <span class="headline">Delete {{ $store.state.categories[id].config.name }}</span>
        </v-card-title>

        <v-card-text>Are you sure you want to remove the category {{ $store.state.categories[id].config.name }}? This cannot be undone</v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="deleteCategoryDialog = false">Cancel</v-btn>
          <v-btn color="red darken-1" text @click="deleteCategory">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-stepper-step :complete="step > 2" step="2" :editable="step > 2">Events</v-stepper-step>
    <v-stepper-content step="2" v-if="ruleset">
      <v-form ref="eventsForm" @submit.prevent="step = 3">
        <v-container>
          <v-switch
            v-for="event in ruleset.events"
            :key="event.id"
            :label="`${event.name} (${event.id.toUpperCase()})`"
            :value="event.id"
            v-model="events"
          />
        </v-container>
        <v-btn color="primary" type="submit" class="mr-2">Continue</v-btn>
        <v-btn text @click="step = 1">Back</v-btn>
      </v-form>
    </v-stepper-content>
    <v-stepper-content step="2" v-else>
      <v-card flat>
        <v-card-title>No ruleset selected</v-card-title>
        <v-card-actions>
          <v-btn @click="step = 1">Back</v-btn>
        </v-card-actions>
      </v-card>
    </v-stepper-content>

    <v-stepper-step :complete="step > 3" step="3" :editable="step > 3">Participants</v-stepper-step>
    <v-stepper-content step="3" v-if="$store.state.categories[id].config.type">
      <PeopleTable
        show-select
        @input="updateParticipants"
        :value="$store.state.categories[id].participants"
        class="mb-4"
        :flat="true"
        v-if="$store.state.categories[id].config.type === 'individual'"
      />
      <TeamsTable
        show-select
        @input="updateParticipants"
        :value="$store.state.categories[id].participants"
        class="mb-4"
        :flat="true"
        v-else-if="$store.state.categories[id].config.type === 'team'"
      />
      <v-btn color="primary" @click="step = 4" class="mr-2">Continue</v-btn>
      <v-btn text @click="step = 2">Back</v-btn>
    </v-stepper-content>
    <v-stepper-content step="3" v-else>
      <v-card flat>
        <v-card-title>Type of competition (individual or team) not selected</v-card-title>
        <v-card-actions>
          <v-btn @click="step = 1">Back</v-btn>
        </v-card-actions>
      </v-card>
    </v-stepper-content>

    <v-stepper-step :complete="step > 4" step="4" :editable="step > 4">Judges</v-stepper-step>
    <v-stepper-content step="4">
      <v-card flat v-if="ruleset">
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
          <template v-slot:item.id="{ item }">
            <span class="cust--nobreak">{{ item.id }}</span>
          </template>
          <template v-slot:item.name="{ item }">
            <span
              class="cust--nobreak"
            >{{ ($store.state.people.people[item.id] || {}).name || 'Click configure to select judge' }}</span>
          </template>

          <template v-slot:item.event="{ item, header }">
            <v-select
              :items="eventByID(header.text).judges"
              label="Judge Type"
              item-text="id"
              item-value="id"
              clearable
              @input="$store.dispatch('categories/updateJudgeAssignment', { id, judgeID: item.id, event: header.text, judgeType: $event })"
              :value="item[header.text]"
            ></v-select>
            <!-- @input="assignJudge(item.id, header.text, $event)" -->
          </template>

          <template v-slot:item.action="{ item }">
            <v-dialog v-model="assignJudgeDialog[item.id]" max-width :retain-focus="false">
              <template v-slot:activator="{ on }">
                <v-btn small class="mr-2 caption" v-on="on">Configure</v-btn>
              </template>
              <v-card>
                <v-card-title>
                  <span class="headline">Assign Judge {{ item.id }}</span>
                </v-card-title>

                <v-card-text>
                  <PeopleTable
                    flat
                    @input="selectedJudges[item.id] = $event[0]"
                    :value="selectedJudge(item.id)"
                    show-select
                    single-select
                  />
                </v-card-text>

                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="blue darken-1"
                    text
                    @click="closeUpdateJudgeIDDialog(item.id)"
                  >Cancel</v-btn>
                  <v-btn color="blue darken-1" text @click="updateJudgeID(item.id)">Save</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
            <v-btn
              small
              color="error"
              class="mr-2 caption"
              @click="$store.dispatch('categories/deleteJudge', { id, judgeID: item.id })"
            >Delete</v-btn>
          </template>
        </v-data-table>
      </v-card>
      <v-btn link :to="`/category/${id}`" class="mr-2" color="primary">Done</v-btn>
      <v-btn text @click="step = 3">Back</v-btn>
    </v-stepper-content>
  </v-stepper>
</template>

<script lang="ts">
import { Component, Props, Vue } from "vue-property-decorator";
import rulesets from "@/rules";
import PeopleTable from "@/components/PeopleTable";
import TeamsTable from "@/components/TeamsTable";

interface SelectedJudges {
  [key: string]: string;
}

@Component({
  components: {
    PeopleTable,
    TeamsTable
  }
})
export default class CategoryConfig<VueClass> extends Vue {
  id: string;
  step: number = 1;
  deleteCategoryDialog: boolean = false;
  rulesets = rulesets;
  assignJudgeDialog = {};
  selectedJudges: SelectedJudges = {};

  created() {
    this.id = this.$route.params.id;
    this.step = this.$route.query.step || this.step;
  }

  deleteCategory() {
    this.$store.commit("categories/deleteCategory", { id: this.id });
    this.$router.push("/");
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

  get events() {
    return this.$store.state.categories[this.id]!.config!.events || [];
  }

  set events(arr) {
    console.log(arr);
    this.$store.dispatch("categories/updateEvents", {
      id: this.id,
      events: arr,
      template: this.ruleset.events.map(el => el.id)
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

    let judges = this.events.map(el => ({
      text: el,
      value: "event",
      align: "center"
    }));

    return begining.concat(judges).concat(end);
  }

  eventByID(eventID) {
    return this.ruleset.events.filter(el => el.id === eventID)[0];
  }

  updateParticipants(arr) {
    console.log(arr);
    this.$store.dispatch("categories/updateParticipants", {
      id: this.id,
      participants: arr
    });
  }

  updateJudgeID(judgeID) {
    if (!this.selectedJudges[judgeID]) return;
    console.log(judgeID, this.selectedJudges[judgeID]);
    this.$store.dispatch("categories/updateJudgeID", {
      id: this.id,
      judgeID,
      newID: this.selectedJudges[judgeID]
    });
    this.selectedJudges[judgeID] = "";
    this.assignJudgeDialog = false;
  }

  closeUpdateJudgeIDDialog(judgeID) {
    this.$delete(this.selectedJudges, judgeID);
    this.assignJudgeDialog[judgeID] = false;
  }

  selectedJudge(judgeID) {
    if (this.selectedJudges[judgeID]) return [this.selectedJudges[judgeID]];
    let person = this.$store.state.people.people[judgeID];
    if (person) {
      return [person.id];
    } else {
      return [];
    }
  }
}
</script>

<style scoped>
.cust--nobreak {
  white-space: nowrap;
}
</style>
