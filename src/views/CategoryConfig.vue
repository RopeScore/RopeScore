<template>
  <v-stepper v-model="step" vertical>
    <v-stepper-step :complete="step > 1" step="1" :editable="step > 1">Basics</v-stepper-step>
    <v-stepper-content step="1">
      <v-form ref="basicsForm" @submit.prevent="step = 2">
        <v-text-field
          label="Category Name"
          :rules="[notEmpty]"
          required
          :value="categories.categories[id].config.name"
          @input="categories._setCategoryName({id, value: $event})"
        />
        <v-combobox
          label="Category Group"
          clearable
          :value="categories.categories[id].config.group"
          @input="categories._setCategoryGroup({id, value: $event})"
          :items="categories.groups"
        >
          <template v-slot:prepend-item>
            <v-list-item>
              <v-list-item-subtitle>Select a group from the list below, or create one by entering a new name</v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-combobox>
        <v-select
          label="Rules"
          :items="rulesets"
          item-text="name"
          item-value="rulesetID"
          item-disabled="disabled"
          :rules="[notEmpty]"
          clearable
          required
          class="mb-6"
          :value="categories.categories[id].config.ruleset"
          @input="categories.setCategoryRuleset({id, value: $event})"
        >
          <template v-slot:prepend-item v-if="categories.categories[id].config.ruleset">
            <v-list-item>
              <v-list-item-subtitle>Changing the ruleset will clear all scores, events and judge assignments</v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-select>
        <v-radio-group
          :value="categories.categories[id].config.type"
          @change="categories._setCategoryType({ id, value: $event })"
          class="pl-2"
        >
          <v-radio label="Individual Competition" value="individual" />
          <v-radio label="Team Competition" value="team" />
        </v-radio-group>
        <v-btn color="primary" type="submit" class="mr-2">Continue</v-btn>
        <!-- <v-btn text class="mr-2">Back</v-btn> -->
        <v-btn color="error" class="mr-2" @click="deleteCategoryDialog = true">Delete</v-btn>
      </v-form>
    </v-stepper-content>

    <v-dialog v-model="deleteCategoryDialog" max-width="500px" :retain-focus="false">
      <v-card>
        <v-card-title>
          <span class="headline">Delete {{ categories.categories[id].config.name }}</span>
        </v-card-title>

        <v-card-text>Are you sure you want to remove the category {{ categories.categories[id].config.name }}? This cannot be undone</v-card-text>

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
        <v-card-subtitle>Removing an event will remove all scores entered for that event</v-card-subtitle>
          <v-card-text>
          <v-row>
            <v-col
              cols="12"
              md="6"
              v-for="event in ruleset.events"
              :key="event.eventID"
            >
              <v-switch
                :label="`${event.name} (${event.eventID.toUpperCase()})`"
                :value="event.eventID"
                v-model="events"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" type="submit" class="mr-2">Continue</v-btn>
          <v-btn text @click="step = 1">Back</v-btn>
        </v-card-actions>
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
    <v-stepper-content step="3" v-if="categories.categories[id].config.type">
      <TeamPersonTable
        flat
        class="mb-4"
        :value="categories.categories[id].participants"
        :team="categories.categories[id].config.type === 'team'"
        @add="categories.newParticipant({ id, value: $event })"
        @delete="categories.deleteParticipant({ id, value: $event })"
        @update="updateParticipant($event)"
        @add-teammember="categories.addTeamMember({ id, ...$event })"
        @delete-teammember="categories._deleteTeamMember({ id, ...$event })"
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
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" dark class="mb-2" @click="categories.addJudge({ id })">Add Judge</v-btn>
        </v-card-actions>

        <v-card-subtitle>
          Changing a judge assignment will clear all scores for that judge. <br/>
          Click edit to set the judge's name.
        </v-card-subtitle>

        <v-dialog :value="!!focusedJudge" v-if="focusedJudge" max-width="500px" :retain-focus="false" @click:outside="editJudge()">
          <v-card>
            <v-card-title>
              <span class="headline">Edit Judge {{ focusedJudge.judgeID }}</span>
            </v-card-title>

            <v-card-text>
              <v-text-field v-model="focusedJudge.name" label="Name" />
              <v-text-field v-model="focusedJudge.ijruID" label="IJRU ID" />
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="grey" text @click="editJudge()">Cancel</v-btn>
              <v-btn color="primary" text @click="updateJudge(focusedJudge)">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-data-table :headers="judgeTableHeaders" :items="categories.categories[id].judges">
          <template v-slot:item.id="{ item }">
            <span class="cust--nobreak">{{ item.judgeID }}</span>
          </template>

          <template v-slot:item.name="{ item }">
            <span class="cust--nobreak">{{ item.name }}</span>
          </template>

          <template v-slot:item.event="{ item, header }">
            <v-select
              :items="eventByID(header.text).judges"
              label="Judge Type"
              item-text="judgeTypeID"
              item-value="judgeTypeID"
              clearable
              @input="categories.setJudgeAssignment({ id, judgeID: item.judgeID, value: { eventID: header.text, judgeTypeID: $event } })"
              :value="((item.assignments || []).find(asg => asg.eventID === header.text) || {}).judgeTypeID"
            />
          </template>

          <template v-slot:item.action="{ item }">
            <v-btn
              small
              color="primary"
              class="mr-2 caption"
              @click="editJudge(item)"
            >Edit</v-btn>
            <v-btn
              small
              color="error"
              class="mr-2 caption"
              @click="categories.deleteJudge({ id, value: item.judgeID })"
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
import { Component, Vue } from "vue-property-decorator";
import rulesets, { Rulesets, Ruleset } from "../rules";
import TeamPersonTable from "../components/TeamPersonTable.vue";
import { wrap } from "comlink";
import CategoriesModule, { TeamPerson, Judge } from "../store/categories";
import { getModule } from "vuex-module-decorators";

@Component({
  components: {
    TeamPersonTable
  }
})
export default class CategoryConfig<VueClass> extends Vue {
  id: string;
  step: number = 1;
  deleteCategoryDialog: boolean = false;
  focusedJudge: Judge | null = null
  rulesets = rulesets;
  categories = getModule(CategoriesModule);

  created() {
    this.id = this.$route.params.id;
    this.step = Number(this.$route.query.step) || this.step;
  }

  deleteCategory() {
    this.categories._deleteCategory({ id: this.id });
    this.$router.push("/");
  }

  notEmpty = (v: string): string | boolean => !!v || "This cannot be empty";

  editJudge (judge?: Judge) {
    if (judge) this.$set(this, 'focusedJudge', JSON.parse(JSON.stringify(judge)))
    else this.$set(this, 'focusedJudge', null)
  }

  updateJudge (judge: Judge) {
    this.categories._setJudgeInfo({ id: this.id, judgeID: judge.judgeID, value: { name: judge.name, ijruID: judge.ijruID } })
    this.editJudge()
  }

  eventByID(eventID: string) {
    return (this.ruleset?.events as Ruleset['events']).find(el => el.eventID === eventID);
  }

  updateParticipant(participant: TeamPerson) {
    console.log(participant);
    this.categories.updateParticipants({
      id: this.id,
      participants: [participant]
    });
  }

  get ruleset() {
    if (!this.categories.categories[this.id].config.ruleset) return;

    return this.rulesets.find(
      ruleset =>
        ruleset.rulesetID === this.categories.categories[this.id].config.ruleset
    );
  }

  get events() {
    return this.categories.categories[this.id]!.config!.events || [];
  }

  set events(arr) {
    console.log(arr);
    this.categories.updateEvents({
      id: this.id,
      events: arr,
      template: (this.ruleset?.events as Ruleset['events']).map(el => el.eventID) ?? []
    });
  }

  get judgeTableHeaders() {
    const begining = [
      {
        text: "ID",
        value: "judgeID",
        align: "end"
      },
      {
        text: "Name",
        value: "name"
      }
    ];
    const end = [
      { text: "Actions", value: "action", sortable: false, align: "end" }
    ];

    const judges = this.events.map(el => ({
      text: el,
      value: "event",
      align: "center"
    }));

    return begining.concat(judges).concat(end);
  }
}
</script>

<style scoped>
.cust--nobreak {
  white-space: nowrap;
}
</style>
