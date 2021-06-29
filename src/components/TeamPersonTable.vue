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
                <v-btn small color="error" @click="deleteTeamMember(item)">Delete</v-btn>
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
            <v-btn color="primary" @click="addParticipant(newParticipant)">Add</v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>

    <v-expand-transition>
      <div v-show="showExcelImport">
        <v-textarea outlined v-model="excelPaste" :error="!!excelError" :placeholder="excelPlaceholder" label="Paste from Excel"/>
        <v-alert type="error" v-if="excelError">{{ excelError }}</v-alert>
      </div>
    </v-expand-transition>
    <div class="text-end">
      <v-btn color="primary" @click="showExcelImport = !showExcelImport" v-if="!showExcelImport">Show Excel Import</v-btn>
      <v-btn color="primary" @click="importParticipants(excelPaste)" v-else :loading="excelLoading">Import</v-btn>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { TableHeader as VuetifyTableHeader } from "../plugins/vuetify";
import CategoriesModule, { TeamPerson, Team, Person } from "../store/categories";
import countriesJSON from "../data/countries.json";
import { getModule } from 'vuex-module-decorators';
import { memberNames } from '@/common'
import { parse as parseCsv } from 'papaparse'

@Component
export default class PeopleTable<VueClass> extends Vue {
  search: string = "";
  deleteParticipantDialog: boolean = false;
  editParticipantDialog: boolean = false;
  countriesJSON = countriesJSON;
  focusedParticipant: TeamPerson | null = null
  categories = getModule(CategoriesModule)
  memberNames = memberNames
  showExcelImport = false
  excelPaste: string = ''
  excelError: string | null = null
  excelLoading = false

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

  importParticipants (csv: string) {
    this.excelLoading = true
    this.excelError = null
    let parsed = parseCsv<string[]>(csv, { delimiter: '\t', skipEmptyLines: true })

    if (parsed.data.length < 1) {
      this.excelError = 'Not enough data provided'
      this.excelLoading = false
      return
    }

    const hasHeaders = parsed.data[0].map(el => el.toLowerCase()).includes('name')
    let indexes ={
        name: 0,
        club: 1,
        country: 2,
        memberNames: this.team ? 3 : -1,
        ijruID: this.team ? -1 : 3
      }

    if (hasHeaders) {
      const headers = parsed.data.shift()!.map(el => el.toLowerCase().replace(/[^\w]/g, ''))

      indexes = {
        name: headers.indexOf('name'),
        club: headers.indexOf('club'),
        country: headers.indexOf('nationality'),
        memberNames: this.team ? headers.indexOf('members') : -1,
        ijruID: this.team ? -1 : headers.indexOf('ijruid')
      }

      if (!this.team && headers.includes('members')) {
        this.excelError = 'It looks like you are trying to import teams into an individual event, remove the Members header and try again'
        this.excelLoading = false
        return
      }

      if (this.team && headers.includes('ijruid')) {
        this.excelError = 'It looks like you are trying to import individuals into a team event, remove the IJRU ID header and try again'
        this.excelLoading = false
        return
      }
    }

    for (let dataRow of parsed.data) {
      const teamPerson = {
        name: dataRow[indexes.name] ?? '',
        club: dataRow[indexes.club] ?? '',
        country: dataRow[indexes.country] ?? '',
        memberNames: '',
        ijruID: ''
      }
      if (this.team) teamPerson.memberNames = dataRow[indexes.memberNames ?? -1] ?? ''
      else teamPerson.ijruID = dataRow[indexes.ijruID ?? -1] ?? ''

      if (teamPerson.country.length && teamPerson.country.length !== 2) {
        teamPerson.country = (this.countries.find(country => country.name === teamPerson.country) ?? {}).id ?? ''
      }

      this.addParticipant(teamPerson)
    }

    this.excelPaste = ''
    this.excelError = null
    this.showExcelImport = false
    this.excelLoading = false
  }

  addParticipant(newParticipant: Omit<Team & Person, "participantID" | 'members'> & { memberNames: string }) {
    const { memberNames, ijruID, ...rest } = newParticipant

    if (!this.team) this.$set(rest, 'ijruID', ijruID)
    if (this.team) {
      const names = memberNames.trim().length
      ? memberNames.split(',').map(str => {
        const matches = /([\w\s]*)(\((\d+)\))?/.exec(str)

        return {
          name: (matches?.[1] ?? '').trim(),
          ijruID: (matches?.[3] ?? '').trim()
        }
      })
      : []

      const members: Omit<Person, 'participantID'>[] = names.map(name => ({
        name: name.name,
        club: newParticipant.club,
        country: newParticipant.country,
        ijruID: name.ijruID
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

  get excelPlaceholder () {
    return this.team
      ? 'Name	Club	Nationality	Members\n...'
      : 'Name	Club	Nationality	IJRU ID\n...'
  }
}
</script>
