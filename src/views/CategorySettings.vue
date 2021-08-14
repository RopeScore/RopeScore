<template>
  <div class="container mx-auto">
    <div class="flex justify-between">
      <h1>
        {{ category?.name || 'Unnamed Category' }}
      </h1>

      <menu class="p-0 m-0">
        <text-button @click="goBack">
          Back
        </text-button>
      </menu>
    </div>

    <fieldset v-if="category">
      <text-field v-model="category.name" label="Category Name" />
      <!-- TODO: remove stuff -->
      <!-- TODO: confirm dialog -->
      <select-field v-model="category.ruleset" label="Ruleset" :data-list="rulesetIds" />
      <p class="mt-2">
        Note that changing the ruleset will clear all competition events, entries, scores and judge assignments
      </p>

      <label class="block mt-2 px-3">
        <input
          :checked="category.type === 'individual'"
          name="category-type"
          value="individual"
          type="radio"
          class=""
          @change="changeType"
        >
        Individual Competiton
      </label>
      <label class="block mt-2 px-3">
        <input
          :checked="category.type === 'team'"
          name="category-type"
          value="team"
          type="radio"
          class=""
          @change="changeType"
        >
        Team Competiton
      </label>
    </fieldset>
  </div>

  <div class="container mx-auto">
    <h2 class="mt-4">
      Competition Events
    </h2>

    <div v-if="!ruleset">
      No or unsupported ruleset selected
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th />
            <th>Competition Event</th>
            <th>Lookup Code</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(definition, cEvtDefCode) of ruleset.competitionEvents" :key="cEvtDefCode">
            <td
              class="p-0 hover:bg-gray-200 cursor-pointer"
              :class="{ 'bg-green-500': cEvtEnabled(cEvtDefCode, category), 'hover:bg-green-300': cEvtEnabled(cEvtDefCode, category) }"
            >
              <label class="px-0.5 flex justify-center items-center w-full h-full">
                <icon-check class="text-white" />
                <input type="checkbox" class="hidden" :checked="cEvtEnabled(cEvtDefCode, category)" @click="toggleCEvt(cEvtDefCode)">
              </label>
            </td>
            <td>{{ definition?.name }}</td>
            <td class="font-thin font-mono text-dark-100">
              {{ cEvtDefCode }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <h2 class="mt-4 container mx-auto">
    Participants
  </h2>

  <div class="max-w-[calc(100vw-1rem)] overflow-x-auto">
    <table class="min-w-full">
      <thead>
        <tr>
          <th class="min-w-16">
            ID
          </th>
          <template v-if="category?.type === 'team'">
            <th>
              Team Name
            </th>
            <th>
              Team Members
            </th>
          </template>
          <template v-else>
            <th>
              Name
            </th>
            <th>
              IJRU ID
            </th>
          </template>
          <th>
            Club
          </th>
          <th>Country</th>
          <th />
        </tr>
      </thead>

      <tbody>
        <tr v-for="participant of participants" :key="participant.id">
          <td class="text-right">
            {{ participant.id }}
          </td>
          <td>{{ participant.name }}</td>
          <td v-if="isTeam(participant)" class="text-xs">
            {{ memberNames(participant) }}
          </td>
          <td v-else>
            {{ participant.ijruId }}
          </td>
          <td>{{ participant.club }}</td>
          <td>{{ participant.country }}</td>
          <td>
            <text-button dense color="red" @click="deleteParticipant(participant)">
              Delete
            </text-button>
          </td>
        </tr>
      </tbody>

      <tfoot>
        <tr>
          <td />
          <td><text-field v-model="newParticipant.name" label="Name" dense /></td>
          <td v-if="category?.type === 'team'">
            <text-field v-model="newParticipant.members" label="Members, comma separated" dense />
          </td>
          <td v-else>
            <text-field v-model="newParticipant.ijruId" label="IJRU ID" dense />
          </td>
          <td><text-field v-model="newParticipant.club" label="Club" dense :data-list="clubNames" /></td>
          <td><text-field v-model="newParticipant.country" label="Country" dense :data-list="countries" /></td>
          <td>
            <text-button dense color="blue" @click="addParticipant">
              Create
            </text-button>
          </td>
        </tr>
      </tfoot>
    </table>
    <!-- TODO: excel import -->
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategory } from '../hooks/categories'
import { useParticipants } from '../hooks/participants'
import { rulesets } from '../rules'
import { isTeam } from '../store/schema'
import { memberNames } from '../helpers'
import { db } from '../store/idbStore'

import countryData from '../data/countries.json'

import TextButton from '../components/TextButton.vue'
import TextField from '../components/TextField.vue'
import SelectField from '../components/SelectField.vue'
import IconCheck from 'virtual:vite-icons/mdi/check'

import type { CompetitionEvent, Category, Participant, Person, Team } from '../store/schema'

const route = useRoute()
const router = useRouter()
const category = useCategory(route.params.categoryId as string)
const participants = useParticipants(route.params.categoryId as string)

const rulesetIds = Object.keys(rulesets)

const newParticipant = reactive({
  name: '',
  members: '',
  ijruId: '',
  club: '',
  country: ''
})

function goBack () { router.go(-1) }

function changeType (event: any) {
  if (!category.value) return
  category.value.type = event.target.value
}

const ruleset = computed(() => {
  if (!category.value) return null
  return rulesets[category.value.ruleset]
})

const clubNames = computed(() => {
  if (!participants.value) return []
  return [...new Set(participants.value.map(p => p.club))]
})

const countries = Object.entries(countryData).map(([cc, name]) => ({ value: cc, text: name }))

function cEvtEnabled (cEvtDef: CompetitionEvent, category: Category | undefined) {
  if (!category) return false
  return category.competitionEvents.includes(cEvtDef)
}

function toggleCEvt (cEvtDef: CompetitionEvent) {
  if (!category.value) return
  category.value.competitionEvents ??= []
  const existsIdx = category.value.competitionEvents.indexOf(cEvtDef)
  if (existsIdx > -1) category.value.competitionEvents.splice(existsIdx, 1)
  else category.value.competitionEvents.push(cEvtDef)
}

const memberRegex = /^([^(]+)(?:\((.*)\))?$/

function addParticipant () {
  if (!category.value) return
  const part: Partial<Participant> = {
    name: newParticipant.name,
    club: newParticipant.club,
    country: newParticipant.country,
    categoryId: category.value.id
  }

  if (category.value.type === 'team') {
    ;(part as Team).members = []
    if (!isTeam(part)) return
    part.members = newParticipant.members.split(',')
      .map((m, idx) => {
        m = m.trim()
        const res = memberRegex.exec(m)
        return {
          id: idx,
          name: res?.[1].trim() ?? '',
          ...(res && res?.[2] ? { ijruId: res[2] } : {})
        }
      })
  } if (newParticipant.ijruId) {
    ;(part as Person).ijruId = newParticipant.ijruId
  }

  participants.value.push(part as Participant)

  newParticipant.name = ''
  newParticipant.members = ''
  newParticipant.ijruId = ''
}

function deleteParticipant (participant: Participant) {
  const participantIdx = participants.value.findIndex(p => p.id === participant.id)
  if (participantIdx < 0) return
  participants.value?.splice(participantIdx, 1)
  db.entries.where('participantId').equals(participant.id).delete()
}
</script>
