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

    <fieldset v-if="group">
      <text-field
        :model-value="group.name"
        :disabled="!!group.completedAt"
        label="Group Name"
        @update:model-value="updateData.name = $event"
      />

      <text-button
        class="mt-2"
        :disabled="!updateData.name"
        :loading="updateGroup.loading.value"
        @click="updateGroup.mutate({ groupId: group?.id!, data: updateData as UpdateGroupInput })"
      >
        Update
      </text-button>
    </fieldset>

    <div>
      <h3 class="mt-4 container mx-auto">
        Group Admins
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
              v-for="admin of groupAdmins"
              :key="admin.id"
            >
              <td><code>{{ admin.id }}</code></td>
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
                <text-field label="User ID" dense :model-value="newAdminId" @update:model-value="newAdminId = $event" />
              </td>
              <td colspan="2">
                <text-button
                  color="blue"
                  dense
                  :disabled="!newAdminId || !!group?.completedAt"
                  :loading="addGroupAdmin.loading.value"
                  @click="addGroupAdmin.mutate({ groupId, userId: newAdminId! })"
                >
                  Add Admin
                </text-button>
              </td>
            </tr>
          </tfoot>
        </table>
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
              <td><code>{{ viewer.id }}</code></td>
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
                <text-field label="User ID" dense :model-value="newViewerId" @update:model-value="newViewerId = $event" />
              </td>
              <td colspan="2">
                <text-button
                  color="blue"
                  dense
                  :disabled="!newViewerId || !!group?.completedAt"
                  :loading="addGroupViewer.loading.value"
                  @click="addGroupViewer.mutate({ groupId, userId: newViewerId! })"
                >
                  Add Viewer
                </text-button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAddGroupAdminMutation, useAddGroupViewerMutation, useRemoveGroupAdminMutation, useRemoveGroupViewerMutation, useGroupInfoQuery, useToggleGroupCompleteMutation, useUpdateGroupMutation, UpdateGroupInput, useMeQuery } from '../graphql/generated'

import { TextButton, TextField } from '@ropescore/components'
import IconLoading from 'virtual:icons/mdi/loading'

const route = useRoute()
const router = useRouter()

const groupId = ref<string>(route.params.groupId as string)
watch(() => route.params.groupId, newId => { groupId.value = newId as string })

const meQuery = useMeQuery()
const groupInfoQuery = useGroupInfoQuery({ groupId: groupId as unknown as string }, { fetchPolicy: 'cache-and-network' })

const me = computed(() => meQuery.result.value?.me)
const group = computed(() => groupInfoQuery.result.value?.group)
const groupViewers = computed(() => groupInfoQuery.result?.value?.group?.viewers ?? [])
const groupAdmins = computed(() => groupInfoQuery.result?.value?.group?.admins ?? [])

const addGroupViewer = useAddGroupViewerMutation({})
const removeGroupViewer = useRemoveGroupViewerMutation({})
const newViewerId = ref<string>()

addGroupViewer.onDone(() => {
  newViewerId.value = undefined
})

const addGroupAdmin = useAddGroupAdminMutation({})
const removeGroupAdmin = useRemoveGroupAdminMutation({})
const newAdminId = ref<string>()

addGroupAdmin.onDone(() => {
  newAdminId.value = undefined
})

const toggleGroupComplete = useToggleGroupCompleteMutation({})

const updateGroup = useUpdateGroupMutation({})
const updateData = reactive<Partial<UpdateGroupInput>>({})

updateGroup.onDone(() => {
  delete updateData.name
})

function goBack () {
  router.go(-1)
}
</script>
