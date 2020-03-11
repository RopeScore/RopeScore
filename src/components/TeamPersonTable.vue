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

    <v-dialog v-model="editParticipantDialog" v-if="focusedParticipant" :max-width="team ? '900px' : '500px'" :retain-focus="false" @click:outside="closeDialogs">
      <v-card>
        <v-card-title>
          <span class="headline">Edit Participant {{ focusedParticipant.participantID }}</span>
        </v-card-title>

        <v-card-text>
          <v-text-field v-model="focusedParticipant.name" label="Name" />
          <v-combobox
            v-model="focusedParticipant.club"
            :items="categories.clubs"
            label="Club"
          />
          <v-autocomplete
            :items="countries"
            label="Nationality"
            item-value="id"
            item-text="name"
            v-model="focusedParticipant.country"
          />
          <v-text-field v-model="focusedParticipant.ijruID" label="IJRU ID" v-if="!team" />

          <span v-if="team" class="subtitle-1">Team Members</span>
          <v-data-table
            :headers="headers(false)"
            :items="focusedParticipant.members"
            v-if="team"
          >
           <template v-slot:item.country="{ item }">{{ countriesJSON[item.country.toUpperCase()] }}</template>

            <template v-slot:item.action="{ item }">
              <div class="text-no-wrap">
                <!-- <v-btn small color="primary" class="mr-2" @click="openEditParticipantDialog(item)">Edit</v-btn> -->
                <v-btn small color="error" @click="openDeleteParticipantDialog(item)">Delete</v-btn>
              </div>
            </template>

            <template v-slot:body.append>
              <tr>
                <td></td>
                <td>
                  <v-text-field v-model="newTeamMember.name" label="Name" />
                </td>
                <td>
                  <v-combobox
                    v-model="newTeamMember.club"
                    :items="categories.clubs"
                    label="Club"
                  />
                </td>
                <td>
                  <v-autocomplete
                    :items="countries"
                    label="Nationality"
                    item-value="id"
                    item-text="name"
                    v-model="newTeamMember.country"
                  />
                </td>
                <td><v-text-field v-model="newTeamMember.ijruID" label="IJRU ID" /></td>
                <td class="text-end">
                  <v-btn color="primary" @click="addTeamMember">Add</v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeDialogs">Cancel</v-btn>
          <v-btn color="primary" text @click="saveParticipant">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteParticipantDialog" v-if="focusedParticipant" max-width="500px" :retain-focus="false" @click:outside="closeDialogs">
      <v-card>
        <v-card-title>
          <span class="headline">Delete {{ focusedParticipant.participantID }}</span>
        </v-card-title>

        <v-card-text>Are you sure you want to remove {{ focusedParticipant.name }} ({{ focusedParticipant.participantID }}) from {{ focusedParticipant.club }}? This cannot be undone</v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeDialogs">Cancel</v-btn>
          <v-btn color="error" text @click="deleteParticipant">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-data-table
      :headers="headers(team)"
      :items="value"
      :search="search"
    >
      <!-- show-group-by -->
      <template v-slot:item.country="{ item }">{{ countriesJSON[item.country.toUpperCase()] }}</template>
      <template v-slot:item.members="{ item }">{{ memberNames(item) }}</template>

      <template v-slot:item.action="{ item }">
        <div class="text-no-wrap">
          <v-btn small color="primary" class="mr-2" @click="openEditParticipantDialog(item)">Edit</v-btn>
          <v-btn small color="error" @click="openDeleteParticipantDialog(item)">Delete</v-btn>
        </div>
      </template>

      <template v-slot:body.append>
        <tr>
          <td></td>
          <td>
            <v-text-field v-model="newParticipant.name" label="Name" />
          </td>
          <td v-if="team">
            <v-text-field v-model="newParticipant.memberNames" label="Team Member Names (comma-separated)" />
          </td>
          <td>
            <v-combobox
              v-model="newParticipant.club"
              :items="categories.clubs"
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
          <td v-if="!team"><v-text-field v-model="newParticipant.ijruID" label="IJRU ID" /></td>
          <td class="text-end">
            <v-btn color="primary" @click="addParticipant()">Add</v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { TableHeader as VuetifyTableHeader } from "../plugins/vuetify";
import CategoriesModule, { TeamPerson, Team, Person } from "../store/categories";
import countriesJSON from "../data/countries.json";
import { getModule } from 'vuex-module-decorators';
import { memberNames } from '@/common'

@Component
export default class PeopleTable<VueClass> extends Vue {
  search: string = "";
  deleteParticipantDialog: boolean = false;
  editParticipantDialog: boolean = false;
  countriesJSON = countriesJSON;
  focusedParticipant: TeamPerson | null = null
  categories = getModule(CategoriesModule);
  memberNames = memberNames

  @Prop({ default: () => [] }) value: TeamPerson[];
  @Prop({ default: false }) team: boolean;

  headers (team: boolean): VuetifyTableHeader[] {
    if (team) {
      return [
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
          text: 'Members',
          value: 'members'
        },
        {
          text: "Club",
          value: "club"
        },
        {
          text: "Nationality",
          value: "country"
        },
        {
          text: "Actions",
          value: "action",
          sortable: false,
          align: "end"
        }
      ]
    } else {
      return [
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
        {
          text: 'IJRU ID',
          value: 'ijruID',
          align: 'end'
        },
        {
          text: "Actions",
          value: "action",
          sortable: false,
          align: "end"
        }
      ]
    }
  }

  newParticipant: Omit<Team & Person, "participantID" | 'members'> & { memberNames: string } = {
    name: "",
    club: "",
    country: "",
    memberNames: '',
    ijruID: ""
  };

  newTeamMember: Omit<Person, "participantID"> = {
    name: '',
    club: '',
    country: '',
    ijruID: ''
  }

  addParticipant() {
    const { memberNames, ijruID, ...rest } = this.newParticipant

    if (!this.team) this.$set(rest, 'ijruID', ijruID)
    if (this.team) {
      const names = memberNames.trim().length ? memberNames.split(',') : []
      const members: Omit<Person, 'participantID'>[] = names.map(name => ({
        name: name.trim(),
        club: this.newParticipant.club,
        country: this.newParticipant.country,
        ijruID: ''
      }));
      this.$set(rest, 'members', members)
    }

    this.$emit("add", rest);

    this.newParticipant.name = "";
    this.newParticipant.memberNames = "";
    this.newParticipant.ijruID = "";
  }

  addTeamMember() {
    const self = this
    this.$emit("add-teammember", { participant: this.focusedParticipant, teamMember: this.newTeamMember })
    this.newTeamMember.name = ''
    setTimeout(() => self.focusedParticipant && self.$set(self.focusedParticipant, 'members', (self.value.find(part => part.participantID === self.focusedParticipant?.participantID) as Team)?.members || []))
  }

  deleteTeamMember(teamMember: Person) {
    const self = this
    this.$emit('delete-teammember', { participantID: this.focusedParticipant?.participantID, teamMemberID: teamMember.participantID })
    setTimeout(() => self.focusedParticipant && self.$set(self.focusedParticipant, 'members', (self.value.find(part => part.participantID === self.focusedParticipant?.participantID) as Team)?.members || []))

  }

  deleteParticipant() {
    if (!this.focusedParticipant) return
    this.$emit("delete", this.focusedParticipant);
    this.closeDialogs()
  }

  saveParticipant() {
    if (!this.focusedParticipant) return
    this.$emit("update", this.focusedParticipant);
    this.closeDialogs()
  }

  openDeleteParticipantDialog(participant: TeamPerson) {
    this.focusedParticipant = this.$set(this, 'focusedParticipant', { ...participant })
    console.log(this.focusedParticipant.participantID);
    this.deleteParticipantDialog = true;
  }

  openEditParticipantDialog (participant: TeamPerson) {
    this.focusedParticipant = this.$set(this, 'focusedParticipant', { ...participant })

    if (this.team) {
      this.newTeamMember.club = this.focusedParticipant.club
      this.newTeamMember.country = this.focusedParticipant.country
    }

    this.editParticipantDialog = true;
  }

  closeDialogs () {
    const self = this
    this.editParticipantDialog = false;
    this.deleteParticipantDialog = false;
    setTimeout(() => (self.$set(self, 'focusedParticipant', null)), 500)
  }

  get countries(): { id: string; name: string }[] {
    return Object.keys(countriesJSON).map(el => ({
      id: el.toLowerCase(),
      name: countriesJSON[el as keyof typeof countriesJSON]
    }));
  }
}
</script>
