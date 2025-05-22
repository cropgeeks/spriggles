<template>
  <v-dialog v-model="visible" :max-width="props.width">
    <v-card :title="props.title">
      <v-card-text>
        <slot />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          :color="props.color"
          text="Close"
          @click="visible = false"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  export interface Options {
    title?: string
    color?: string
    width?: number
  }

  const props = withDefaults(defineProps<Options>(), {
    color: 'primary',
    title: '',
    width: 290,
  })

  const visible = ref<boolean>(false)

  function show () {
    visible.value = true
  }

  defineExpose({
    show,
  })
</script>
