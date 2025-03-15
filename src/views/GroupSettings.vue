<template>
  <div class="container mx-auto">
    <div class="flex justify-between">
      <h1
        class="font-semibold text-2xl"
        :class="{ 'text-green-700': !!group?.completedAt }"
      >
        {{ group?.name }}
      </h1>

      <menu class="p-0 m-0">
        <text-button :loading="groupInfoQuery.loading.value" @click="groupInfoQuery.refetch()">
          Refresh
        </text-button>
        <text-button
          :loading="toggleGroupComplete.loading.value"
          @click="toggleGroupComplete.mutate({ groupId: group?.id!, completed: !group?.completedAt })"
        >
          {{ group?.completedAt ? 'Uncomplete' : 'Complete' }}
        </text-button>
        <text-button @click="goBack">
          Back
        </text-button>
      </menu>
    </div>

    <form v-if="group" @submit.prevent="updateGroup.mutate({ groupId: group?.id!, data: updateData as UpdateGroupInput })">
      <text-field
        :model-value="updateData.name"
        :disabled="!!group.completedAt"
        label="Group Name"
        required
        @update:model-value="updateData.name = ($event as string)"
      />

      <select-field
        :model-value="updateData.resultVisibility ?? undefined"
        :disabled="!!group.completedAt"
        label="Result visibility"
        :data-list="resultVisibilitiesDataList"
        @update:model-value="updateData.resultVisibility = ($event as ResultVisibilityLevel)"
      />

      <text-button
        class="mt-2"
        :loading="updateGroup.loading.value"
        type="submit"
        color="blue"
      >
        Update
      </text-button>
    </form>

    <div>
      <h3 class="mt-4 container mx-auto">
        Group Admins
      </h3>

      <div class="table-wrapper">
        <table class="min-w-full">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th class="w-40" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="admin of groupAdmins"
              :key="admin.id"
            >
              <td><code>{{ admin.username }}</code></td>
              <td>{{ admin.name }}</td>
              <td>
                <text-button
                  v-if="admin.id !== me?.id"
                  color="red"
                  dense
                  :disabled="!!group?.completedAt"
                  :loading="removeGroupAdmin.loading.value"
                  @click="removeGroupAdmin.mutate({ groupId, userId: admin.id })"
                >
                  Remove Admin
                </text-button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                <text-field
                  form="new-admin"
                  label="Username"
                  type="email"
                  required
                  dense
                  :model-value="newAdminUsername"
                  @update:model-value="newAdminUsername = ($event as string)"
                />
              </td>
              <td colspan="2">
                <text-button
                  form="new-admin"
                  color="blue"
                  dense
                  :disabled="!newAdminUsername || !!group?.completedAt"
                  :loading="addGroupAdmin.loading.value"
                  type="submit"
                >
                  Add Admin
                </text-button>
              </td>
            </tr>
          </tfoot>
        </table>
        <form id="new-admin" @submit.prevent="addGroupAdmin.mutate({ groupId, username: newAdminUsername! })" />
      </div>
    </div>

    <div>
      <h3 class="mt-4 container mx-auto">
        Group Viewers
      </h3>

      <div class="table-wrapper">
        <table class="min-w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th class="w-40" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="viewer of groupViewers"
              :key="viewer.id"
            >
              <td><code>{{ viewer.username }}</code></td>
              <td>{{ viewer.name }}</td>
              <td>
                <text-button
                  color="red"
                  dense
                  :disabled="!!group?.completedAt"
                  :loading="removeGroupViewer.loading.value"
                  @click="removeGroupViewer.mutate({ groupId, userId: viewer.id })"
                >
                  Remove Viewer
                </text-button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                <text-field
                  form="new-viewer"
                  label="Username"
                  type="email"
                  required
                  dense
                  :model-value="newViewerUsername"
                  @update:model-value="newViewerUsername = ($event as string)"
                />
              </td>
              <td colspan="2">
                <text-button
                  form="new-viewer"
                  color="blue"
                  dense
                  :disabled="!newViewerUsername || !!group?.completedAt"
                  :loading="addGroupViewer.loading.value"
                  type="submit"
                >
                  Add Viewer
                </text-button>
              </td>
            </tr>
          </tfoot>
        </table>
        <form id="new-viewer" @submit.prevent="addGroupViewer.mutate({ groupId, username: newViewerUsername! })" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAddGroupAdminMutation, useAddGroupViewerMutation, useRemoveGroupAdminMutation, useRemoveGroupViewerMutation, useGroupInfoQuery, useToggleGroupCompleteMutation, useUpdateGroupMutation, type UpdateGroupInput, useMeQuery, type ResultVisibilityLevel } from '../graphql/generated'
import { useRouteParams } from '@vueuse/router'

import { TextButton, TextField, SelectField } from '@ropescore/components'
import { resultVisibilitiesDataList } from '../helpers'

const groupId = useRouteParams<string>('groupId', '')

const router = useRouter()

const meQuery = useMeQuery()
const groupInfoQuery = useGroupInfoQuery({ groupId: groupId as unknown as string }, { fetchPolicy: 'cache-and-network' })

const me = computed(() => meQuery.result.value?.me)
const group = computed(() => groupInfoQuery.result.value?.group)
const groupViewers = computed(() => groupInfoQuery.result?.value?.group?.viewers ?? [])
const groupAdmins = computed(() => groupInfoQuery.result?.value?.group?.admins ?? [])

const addGroupViewer = useAddGroupViewerMutation({})
const removeGroupViewer = useRemoveGroupViewerMutation({})
const newViewerUsername = ref<string>()

addGroupViewer.onDone(() => {
  newViewerUsername.value = undefined
})

const addGroupAdmin = useAddGroupAdminMutation({})
const removeGroupAdmin = useRemoveGroupAdminMutation({})
const newAdminUsername = ref<string>()

addGroupAdmin.onDone(() => {
  newAdminUsername.value = undefined
})

const toggleGroupComplete = useToggleGroupCompleteMutation({})

const updateGroup = useUpdateGroupMutation({})
const updateData = reactive<Partial<UpdateGroupInput>>({})

watch(group, group => {
  updateData.name = group?.name
  updateData.resultVisibility = group?.resultVisibility
})

function goBack () {
  router.go(-1)
}
</script>
