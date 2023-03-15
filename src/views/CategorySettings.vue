<template>
  <div class="container mx-auto">
    <div class="flex justify-between">
      <h1>
        {{ category?.name || 'Unnamed Category' }}
      </h1>

      <menu class="p-0 m-0">
        <text-button :loading="categorySettingsQuery.loading.value" @click="categorySettingsQuery.refetch()">
          Refresh
        </text-button>
        <text-button color="red" :loading="deleting" @click="deleteConfirm ? deleteCategoryMutation.mutate() : deleteConfirm = true">
          {{ deleteConfirm ? 'Confirm Delete' : 'Delete' }}
        </text-button>
        <text-button @click="goBack">
          Back
        </text-button>
      </menu>
    </div>

    <!-- <fieldset v-if="category">
      <text-field v-model="category.name" label="Category Name" />
      <select-field
        v-model="category.ruleset"
        label="Ruleset"
        :data-list="rulesetIds"
        @update:model-value="clearValues"
      />
      <select-field
        v-model="category.type"
        label="Competition Type"
        :data-list="['individual', 'team']"
        @update:model-value="clearValues"
      />

      <p class="mt-2">
        Note that changing the ruleset or competition type will clear all competition events, entries, scores and judge assignments
      </p>
    </fieldset> -->
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
                <icon-check v-if="!updateCategory.loading.value" class="text-white" />
                <icon-loading v-else class="animate-spin text-white" />
                <input type="checkbox" class="hidden" :checked="cEvtEnabled(cEvtDefCode, category)" :disabled="updateCategory.loading.value" @click="toggleCEvt(cEvtDefCode)">
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
          <template v-if="category?.type === CategoryType.Team">
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
          <td class="text-right text-xs">
            {{ participant.id }}
          </td>
          <td>{{ participant.name }}</td>
          <td v-if="category?.type === CategoryType.Team" class="text-xs">
            {{ memberNames(participant) }}
          </td>
          <td v-else-if="isAthlete(participant)">
            {{ participant.ijruId }}
          </td>
          <td>{{ participant.club }}</td>
          <td>{{ participant.country }}</td>
          <td class="text-center">
            <edit-participant
              :participant="participant"
              :type="category?.type!"
              :club-names="clubNames"
            />
            <text-button
              dense
              color="red"
              :loading="deleteParticipantMutation.loading.value"
              @click="deleteParticipantMutation.mutate({ participantId: participant.id })"
            >
              Delete
            </text-button>
          </td>
        </tr>
      </tbody>

      <tfoot>
        <tr>
          <td />
          <td><text-field v-model="newParticipant.name" :disabled="createParticipantLoading" label="Name" dense /></td>
          <td v-if="category?.type === CategoryType.Team">
            <text-field v-model="newParticipant.members" :disabled="createParticipantLoading" label="Members, comma separated" dense />
          </td>
          <td v-else>
            <text-field v-model="newParticipant.ijruId" :disabled="createParticipantLoading" label="IJRU ID" dense />
          </td>
          <td><text-field v-model="newParticipant.club" :disabled="createParticipantLoading" label="Club" dense :data-list="clubNames" /></td>
          <td><text-field v-model="newParticipant.country" :disabled="createParticipantLoading" label="Country" dense :data-list="countries" /></td>
          <td class="text-center">
            <text-button
              dense
              color="blue"
              :disabled="!newParticipant.name || (category?.type === CategoryType.Team && !newParticipant.members)"
              :loading="createParticipantLoading"
              @click="addParticipant()"
            >
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
      Changing a judge assignments judge type or pool will clear all scores for
      that judge in this category.
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
          <th v-for="cEvtDefCode of category.competitionEventIds" :key="cEvtDefCode" colspan="3">
            {{ getAbbr(cEvtDefCode) }}
          </th>
          <th v-if="!category.competitionEventIds.length" />
        </tr>
      </thead>

      <tbody>
        <tr v-for="judge of judges" :key="judge.id">
          <td class="text-right text-xs">
            {{ judge.id }}
          </td>
          <td>{{ judge.name }}</td>
          <td>{{ judge.ijruId }}</td>
          <template v-for="cEvtDefCode of category.competitionEventIds" :key="cEvtDefCode">
            <td>
              <select-field
                :model-value="getAssignment(judge.assignments, cEvtDefCode)?.judgeType"
                label=" "
                :disabled="judgeAssignmentLoading"
                dense
                :data-list="judgeTypes(cEvtDefCode)"
                @update:model-value="updateAssignment(judge, cEvtDefCode, $event)"
              />
            </td>
            <td>
              <number-field
                :model-value="getAssignment(judge.assignments, cEvtDefCode)?.pool ?? undefined"
                label="Pool"
                class="max-w-20"
                :disabled="judgeAssignmentLoading || !getAssignment(judge.assignments, cEvtDefCode)?.judgeType"
                dense
                :step="1"
                @update:model-value="updateAssignmentPool(judge, cEvtDefCode, $event)"
              />
            </td>
            <td>
              <label class="flex gap-1">
                <checkbox-field
                  :model-value="getAssignment(judge.assignments, cEvtDefCode)?.options?.live"
                  dense
                  :loading="updateJudgeAssignment.loading.value"
                  :disabled="!getAssignment(judge.assignments, cEvtDefCode)"
                  @change="toggleAssignmentLive(getAssignment(judge.assignments, cEvtDefCode)!)"
                />
                <abbr title="Live display">L</abbr>
              </label>
            </td>
          </template>
        </tr>
      </tbody>

      <tfoot>
        <tr>
          <td />
          <td><text-field v-model="newJudge.name" :disabled="createJudgeMutation.loading.value" label="Name" dense /></td>
          <td><text-field :model-value="newJudge.ijruId ?? ''" :disabled="createJudgeMutation.loading.value" label="IJRU ID" dense @update:model-value="newJudge.ijruId = $event" /></td>
          <td :colspan="category.competitionEventIds.length * 3">
            <text-button
              dense
              color="blue"
              :loading="createJudgeMutation.loading.value"
              :disabled="!newJudge.name"
              @click="createJudgeMutation.mutate({ groupId: route.params.groupId as string, data: newJudge })"
            >
              Create
            </text-button>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRuleset } from '../hooks/rulesets'
import { memberNames, getAbbr, CompetitionEvent, isAthlete } from '../helpers'
import {
  CategoryType, CreateAthleteInput, CreateJudgeInput, CreateTeamInput, Judge, JudgeAssignmentFragment, Participant,
  Category,
  useCategorySettingsQuery,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
  useCreateJudgeMutation,
  useCreateJudgeAssignmentMutation,
  useUpdateJudgeAssignmentMutation,
  useDeleteJudgeAssignmentMutation,
  useCreateAthleteMutation,
  useCreateTeamMutation,
  useDeleteParticipantMutation
} from '../graphql/generated'

import countryData from '../data/countries.json'

import { TextButton, TextField, SelectField, CheckboxField, NumberField } from '@ropescore/components'
import EditParticipant from '../components/EditParticipant.vue'
import IconCheck from 'virtual:icons/mdi/check'
import IconLoading from 'virtual:icons/mdi/loading'

const route = useRoute()
const router = useRouter()

const categorySettingsQuery = useCategorySettingsQuery({
  groupId: route.params.groupId as string,
  categoryId: route.params.categoryId as string
}, { fetchPolicy: 'cache-and-network' })

const category = computed(() => categorySettingsQuery.result.value?.group?.category)
const participants = computed(() => categorySettingsQuery.result.value?.group?.category?.participants ?? [])
const judges = computed(() => categorySettingsQuery.result.value?.group?.judges ?? [])

function goBack () { router.go(-1) }

const deleteConfirm = ref(false)
const deleting = ref(false)

const deleteCategoryMutation = useDeleteCategoryMutation({
  variables: { categoryId: route.params.categoryId as string },
  refetchQueries: ['Groups']
})

deleteCategoryMutation.onDone(() => {
  router.replace({ name: 'home' })
})

const ruleset = computed(() => {
  if (!category.value?.rulesId) return null
  return useRuleset(category.value.rulesId).value
})

const clubNames = computed(() => {
  if (!participants.value) return []
  return [...new Set(participants.value.map(p => p.club).filter(c => typeof c === 'string'))] as string[]
})

const countries = Object.entries(countryData).map(([cc, name]) => ({ value: cc, text: name }))

function cEvtEnabled (cEvtDef: CompetitionEvent, category: Pick<Category, 'competitionEventIds'> | undefined | null) {
  if (!category) return false
  return category.competitionEventIds.includes(cEvtDef)
}

const updateCategory = useUpdateCategoryMutation({
  refetchQueries: ['CategorySettings'],
  awaitRefetchQueries: true
})

function toggleCEvt (cEvtDef: CompetitionEvent) {
  if (!category.value) return
  const competitionEventIds = [...category.value.competitionEventIds]
  const existsIdx = competitionEventIds.indexOf(cEvtDef)

  if (existsIdx > -1) competitionEventIds.splice(existsIdx, 1)
  else competitionEventIds.push(cEvtDef)

  const template = Object.keys(ruleset.value?.competitionEvents ?? {})
  competitionEventIds.sort((a, b) => template.indexOf(a) - template.indexOf(b))

  updateCategory.mutate({ categoryId: category.value.id, data: { competitionEventIds } })
}

const newParticipant = reactive({
  name: '',
  members: '',
  ijruId: '',
  club: '',
  country: ''
})

const createAthleteMutation = useCreateAthleteMutation({
  refetchQueries: ['CategorySettings'],
  awaitRefetchQueries: true
})
const createTeamMutation = useCreateTeamMutation({
  refetchQueries: ['CategorySettings'],
  awaitRefetchQueries: true
})

const deleteParticipantMutation = useDeleteParticipantMutation({
  refetchQueries: ['CategorySettings'],
  awaitRefetchQueries: true
})

const createParticipantLoading = computed(() => createAthleteMutation.loading.value || createTeamMutation.loading.value)

createAthleteMutation.onDone(() => {
  newParticipant.name = ''
  newParticipant.members = ''
  newParticipant.ijruId = ''
})
createTeamMutation.onDone(() => {
  newParticipant.name = ''
  newParticipant.members = ''
  newParticipant.ijruId = ''
})

function addParticipant () {
  const part: Partial<Participant> = {
    name: newParticipant.name,
    club: newParticipant.club,
    country: newParticipant.country
  }

  if (category.value?.type === CategoryType.Team) {
    const team = part as CreateTeamInput
    team.members = newParticipant.members.split(',')

    createTeamMutation.mutate({
      categoryId: route.params.categoryId as string,
      data: team
    })
  } else {
    const athlete = part as CreateAthleteInput
    athlete.ijruId = newParticipant.ijruId

    createAthleteMutation.mutate({
      categoryId: route.params.categoryId as string,
      data: athlete
    })
  }
}

const createJudgeMutation = useCreateJudgeMutation({
  refetchQueries: ['CategorySettings'],
  awaitRefetchQueries: true
})
const newJudge = reactive<CreateJudgeInput>({
  name: '',
  ijruId: undefined
})

createJudgeMutation.onDone(() => {
  newJudge.name = ''
  newJudge.ijruId = undefined
})

function judgeTypes (cEvtDef: CompetitionEvent) {
  if (!ruleset.value) return []
  const types = ruleset.value.competitionEvents[cEvtDef]?.judges.map(j => j.id) ?? []
  types.unshift('none')
  return types
}

function getAssignment (assignments: JudgeAssignmentFragment[], cEvtDef: CompetitionEvent) {
  return assignments.find(ja => ja.competitionEventId === cEvtDef)
}

const createJudgeAssignment = useCreateJudgeAssignmentMutation({
  refetchQueries: ['CategorySettings'],
  awaitRefetchQueries: true
})
const updateJudgeAssignment = useUpdateJudgeAssignmentMutation({
  refetchQueries: ['CategorySettings'],
  awaitRefetchQueries: true
})
const deleteJudgeAssignment = useDeleteJudgeAssignmentMutation({
  refetchQueries: ['CategorySettings'],
  awaitRefetchQueries: true
})

const judgeAssignmentLoading = computed(() => createJudgeAssignment.loading.value || deleteJudgeAssignment.loading.value)

async function updateAssignment (judge: Pick<Judge, 'id'> & { assignments: JudgeAssignmentFragment[] }, cEvtDef: CompetitionEvent, judgeType: string) {
  const existing = judge.assignments.find(ja => ja.competitionEventId === cEvtDef)

  if (existing && judgeType === 'none') {
    await deleteJudgeAssignment.mutate({ judgeAssignmentId: existing.id })
  } else if (existing) {
    await deleteJudgeAssignment.mutate({ judgeAssignmentId: existing.id }, { awaitRefetchQueries: false, refetchQueries: [] })
    await createJudgeAssignment.mutate({ categoryId: route.params.categoryId as string, judgeId: judge.id, data: { competitionEventId: cEvtDef, judgeType } })
  } else if (judgeType !== 'none') {
    await createJudgeAssignment.mutate({ categoryId: route.params.categoryId as string, judgeId: judge.id, data: { competitionEventId: cEvtDef, judgeType } })
  }
}

async function updateAssignmentPool (judge: Pick<Judge, 'id'> & { assignments: JudgeAssignmentFragment[] }, cEvtDef: CompetitionEvent, pool: number) {
  const existing = judge.assignments.find(ja => ja.competitionEventId === cEvtDef)

  if (existing) {
    await deleteJudgeAssignment.mutate({ judgeAssignmentId: existing.id }, { awaitRefetchQueries: false, refetchQueries: [] })
    await createJudgeAssignment.mutate({ categoryId: route.params.categoryId as string, judgeId: judge.id, data: { competitionEventId: cEvtDef, judgeType: existing.judgeType, pool, options: existing.options } })
  }
}

async function toggleAssignmentLive (jA: JudgeAssignmentFragment) {
  if (!jA) return
  const options = {
    ...(jA.options ?? {}),
    live: !jA.options?.live
  }

  updateJudgeAssignment.mutate({ judgeAssignmentId: jA.id, data: { options } })
}
</script>
