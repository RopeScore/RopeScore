<template>
  <v-container fluid>
    <v-card-title>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>

    <!-- <v-dialog v-model="editPersonDialog" max-width="500px" :retain-focus="false">
      <v-card>
        <v-card-title>
          <span class="headline">Edit Person {{ focusedPerson.participantID }}</span>
        </v-card-title>

        <v-card-text>
          <v-text-field v-model="focusedPerson.name" label="Name" />
          <v-combobox
            v-model="focusedPerson.club"
            :items="$store.getters['people/clubs']"
            label="Club"
          />
          <v-autocomplete
            :items="countries"
            label="Nationality"
            item-value="id"
            item-text="name"
            v-model="focusedPerson.country"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="editPersonDialog = false">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="savePerson">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>-->

    <v-dialog v-model="deletePersonDialog" max-width="500px" :retain-focus="false">
      <v-card>
        <v-card-title>
          <span class="headline">Delete {{ focused }}</span>
        </v-card-title>

        <v-card-text>Are you sure you want to remove {{ getParticipant(focused).name }} ({{ getParticipant(focused).participantID }}) from {{ getParticipant(focused).club }}? This cannot be undone</v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="deletePersonDialog = false">Cancel</v-btn>
          <v-btn color="red darken-1" text @click="deletePerson">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-data-table
      :headers="headers"
      :items="value"
      :search="search"
      @input="$emit('input', $event)"
    >
      <!-- show-group-by -->
      <template v-slot:item.country="{ item }">{{ countriesJSON[item.country.toUpperCase()] }}</template>

      <template v-slot:item.action="{ item }">
        <v-btn small color="error" @click="openDeletePersonDialog(item)">Delete</v-btn>
      </template>

      <template v-slot:body.append>
        <tr>
          <td></td>
          <td>
            <v-text-field v-model="newParticipant.name" label="Name" />
          </td>
          <td>
            <!-- TODO: clubs from either all categories or current category -->
            <v-combobox
              v-model="newParticipant.club"
              :items="$store.getters['people/clubs']"
              label="Club"
            />
          </td>
          <td>
            <v-autocomplete
              :items="countries"
              label="Nationality"
              item-value="id"
              item-text="name"
              v-model="newParticipant.country"
            />
          </td>
          <!-- <td></td> -->
          <td class="text-end">
            <v-btn color="primary" @click="addParticipant()">Add</v-btn>
          </td>
        </tr>
        <!-- <tr>
          <td colspan="4"></td>
          <td><v-text-field v-model="newParticipant.name" label="IJRU ID" /></td>
          <td class="text-end">
            <v-btn color="primary" @click="importPerson()">Import</v-btn>
          </td>
        </tr>-->
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { TableHeader as VuetifyTableHeader } from "../plugins/vuetify";
import { TeamPerson } from "../store/categories";
import countriesJSON from "../data/countries.json";

@Component
export default class PeopleTable<VueClass> extends Vue {
  search: string = "";
  deletePersonDialog: boolean = false;
  countriesJSON = countriesJSON;

  @Prop({ default: () => [] }) value: TeamPerson[];

  headers: VuetifyTableHeader[] = [
    {
      text: "ID",
      value: "participantID",
      align: "end"
    },
    {
      text: "Name",
      value: "name"
    },
    {
      text: "Club",
      value: "club"
    },
    {
      text: "Nationality",
      value: "country"
    },
    // {
    //   text: 'IJRU ID',
    //   value: 'ijruID',
    //   align: 'end'
    // },
    {
      text: "Actions",
      value: "action",
      sortable: false,
      align: "end"
    }
  ];

  newParticipant: Omit<TeamPerson, "participantID"> = {
    name: "",
    club: "",
    country: ""
  };

  focused?: string = "";

  addParticipant() {
    this.$emit("add", this.newParticipant);
    this.newParticipant.name = "";
  }

  deletePerson() {
    this.$emit("delete", this.focused);
    this.deletePersonDialog = false;
  }

  openDeletePersonDialog(participant: TeamPerson) {
    this.focused = participant.participantID;
    console.log(this.focused);
    this.deletePersonDialog = true;
  }

  getParticipant(participantID: string) {
    return this.value.find(par => par.participantID === participantID) || {};
  }

  get countries(): { id: string; name: string }[] {
    return Object.keys(countriesJSON).map(el => ({
      id: el.toLowerCase(),
      name: countriesJSON[el as keyof typeof countriesJSON]
    }));
  }
}
</script>
