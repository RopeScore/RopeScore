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

      <p class="mt-2">
        Note that changing the ruleset or competition type will clear all competition events, entries, scores and judge assignments
      </p>
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
          <tr v-for="(definition, cEvtDefCode) of (ruleset?.competitionEvents ?? {})" :key="cEvtDefCode">
            <td
              class="p-0 hover:bg-gray-200"
              :class="{ 'bg-green-500': cEvtEnabled(cEvtDefCode, category), 'hover:bg-green-300': cEvtEnabled(cEvtDefCode, category) }"
            >
              <label class="px-0.5 flex justify-center items-center w-full h-full cursor-pointer">
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

  <div class="table-wrapper">
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
          <td v-if="category?.type === 'team'" class="text-xs">
            {{ memberNames(participant) }}
          </td>
          <td v-else-if="isPerson(participant)">
            {{ participant.ijruId }}
          </td>
          <td>{{ participant.club }}</td>
          <td>{{ participant.country }}</td>
          <td class="text-center">
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
          <td class="text-center">
            <text-button dense color="blue" @click="addParticipant">
              Create
            </text-button>
          </td>
        </tr>
      </tfoot>
    </table>
    <!-- TODO: excel import -->
  </div>

  <h2 class="mt-4 container mx-auto">
    Judges
  </h2>

  <div class="container mx-auto">
    <p>
      Changing a judge assignemnt will clear all scores for that judge in this
      category.
    </p>
    <p>
      Judges are shared across categories in a group.
    </p>
  </div>

  <div v-if="ruleset && category" class="max-w-[calc(100vw-1rem)] overflow-x-auto">
    <table class="min-w-full">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>IJRU ID</th>
          <th v-for="cEvtDefCode of category.competitionEvents" :key="cEvtDefCode">
            {{ getAbbr(cEvtDefCode) }}
          </th>
          <th v-if="!category.competitionEvents.length" />
        </tr>
      </thead>

      <tbody>
        <tr v-for="judge of judges" :key="judge.id">
          <td class="text-right">
            {{ judge.id }}
          </td>
          <td>{{ judge.name }}</td>
          <td>{{ judge.ijruId }}</td>
          <td v-for="cEvtDefCode of category.competitionEvents" :key="cEvtDefCode">
            <select-field
              :model-value="getAssignment(judge.id, cEvtDefCode)?.judgeType"
              label=" "
              dense
              :data-list="judgeTypes(cEvtDefCode)"
              @update:model-value="updateAssignment(judge.id, cEvtDefCode, $event)"
            />
          </td>
        </tr>
      </tbody>

      <tfoot>
        <tr>
          <td />
          <td><text-field v-model="newJudge.name" label="Name" dense /></td>
          <td><text-field v-model="newJudge.ijruId" label="IJRU ID" dense /></td>
          <td :colspan="category.competitionEvents.length">
            <text-button dense color="blue" @click="addJudge">
              Create
            </text-button>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategory } from '../hooks/categories'
import { useParticipants } from '../hooks/participants'
import { useJudges } from '../hooks/judges'
import { useJudgeAssignments } from '../hooks/judgeAssignments'
import { useRuleset } from '../hooks/rulesets'
import { rulesets } from '../rules'
import { isTeam, isPerson } from '../store/schema'
import { memberNames, getAbbr } from '../helpers'
import { db } from '../store/idbStore'

import countryData from '../data/countries.json'

import TextButton from '../components/TextButton.vue'
import TextField from '../components/TextField.vue'
import SelectField from '../components/SelectField.vue'
import IconCheck from 'virtual:vite-icons/mdi/check'

import type { CompetitionEvent, Category, Participant, Person, Team, Judge, JudgeAssignment } from '../store/schema'

const route = useRoute()
const router = useRouter()
const category = useCategory(route.params.categoryId as string)
const participants = useParticipants(route.params.categoryId as string)
const judges = useJudges(route.params.groupId as string)
const judgeAssignments = useJudgeAssignments(route.params.categoryId as string)

const rulesetIds = Object.keys(rulesets)

const newParticipant = reactive({
  name: '',
  members: '',
  ijruId: '',
  club: '',
  country: ''
})

const newJudge = reactive({
  name: '',
  ijruId: ''
})

function goBack () { router.go(-1) }

function changeType (event: any) {
  if (!category.value) return
  category.value.type = event.target.value
}

const ruleset = computed(() => {
  if (!category.value) return null
  return useRuleset(category.value.ruleset).value
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

  // TODO: sort
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

function addJudge () {
  if (!category.value) return

  const judge: Omit<Judge, 'id'> = {
    groupId: route.params.groupId as string,
    name: newJudge.name,
    ...(newJudge.ijruId ? { ijruId: newJudge.ijruId } : {})
  }

  judges.value.push(judge as Judge)

  newJudge.name = ''
  newJudge.ijruId = ''
}

function judgeTypes (cEvtDef: CompetitionEvent) {
  if (!ruleset.value) return []
  const types = ruleset.value.competitionEvents[cEvtDef]?.judges.map(j => j.id) ?? []
  types.unshift('none')
  return types
}

function getAssignment (judgeId: Judge['id'], cEvtDef: CompetitionEvent) {
  if (!judgeAssignments.value) return
  return judgeAssignments.value.find(ja => ja.judgeId === judgeId && ja.competitionEvent === cEvtDef)
}

function updateAssignment (judgeId: Judge['id'], cEvtDef: CompetitionEvent, judgeType: string) {
  if (!judgeAssignments.value) return
  const existingIdx = judgeAssignments.value.findIndex(ja => ja.judgeId === judgeId && ja.competitionEvent === cEvtDef)

  if (existingIdx > -1 && judgeType === 'none') {
    judgeAssignments.value.splice(existingIdx, 1)
  } else if (existingIdx > -1) {
    judgeAssignments.value.splice(existingIdx, 1, {
      id: judgeAssignments.value[existingIdx].id,
      categoryId: route.params.categoryId as string,
      judgeId,
      judgeType,
      competitionEvent: cEvtDef
    })
  } else if (judgeType !== 'none') {
    judgeAssignments.value.push({
      categoryId: route.params.categoryId as string,
      judgeId,
      judgeType,
      competitionEvent: cEvtDef
    } as JudgeAssignment)
  }
}
</script>
