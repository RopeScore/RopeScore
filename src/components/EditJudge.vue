<template>
  <dialog-button ref="dialogRef" dense label="Edit">
    <h1 class="mx-2">
      Edit Judge
    </h1>
    <span class="mx-2">Judge: {{ judge.id }}</span>

    <form method="dialog" class="mt-4" @submit.prevent="updateJudge()">
      <text-field
        :model-value="judge.name"
        :disabled="loading"
        label="Name"
        required
        @update:model-value="newJudge.name = ($event as string)"
      />

      <text-field
        :model-value="judge.ijruId ?? ''"
        :disabled="loading"
        label="IJRU ID"
        @update:model-value="newJudge.ijruId = ($event as string)"
      />

      <text-button
        color="blue"
        class="mt-4"
        type="submit"
        :loading="loading"
      >
        Save
      </text-button>
    </form>
  </dialog-button>
</template>

<script setup lang="ts">
import { type PropType, ref, reactive, toRef, computed } from 'vue'
import { useUpdateJudgeMutation, type JudgeBaseFragment, type Judge } from '../graphql/generated'

import { DialogButton, TextButton, TextField } from '@ropescore/components'

const props = defineProps({
  judge: {
    type: Object as PropType<JudgeBaseFragment>,
    required: true
  }
})

const judge = toRef(props, 'judge')

const dialogRef = ref<typeof DialogButton>()

const newJudge = reactive({
  name: '',
  ijruId: ''
})

const updateJudgeMutation = useUpdateJudgeMutation({})

const loading = computed(() => updateJudgeMutation.loading.value)

updateJudgeMutation.onDone(() => {
  dialogRef.value?.close()

  newJudge.name = ''
  newJudge.ijruId = ''
})

async function updateJudge () {
  const part: Partial<Judge> = {}

  if (newJudge.name?.length > 0) part.name = newJudge.name
  if (newJudge.ijruId?.length > 0) part.ijruId = newJudge.ijruId

  await updateJudgeMutation.mutate({
    judgeId: judge.value.id,
    data: {
      name: newJudge.name?.length > 0 ? newJudge.name : null,
      ijruId: newJudge.ijruId?.length > 0 ? newJudge.ijruId : null
    }
  })
}
</script>
