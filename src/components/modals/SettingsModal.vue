<template>
  <v-dialog v-model="visible" class="settings" max-width="720">
    <v-card title="Settings">
      <v-card-text>
        Change global Spriggles settings below.
      </v-card-text>

      <v-card-text>
        <v-form @submit.prevent="saveSettings">
          <h6 class="text-h6 mb-3">Polygon options</h6>

          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-color-input
                v-model="fill"
                color-pip
                :icon-color="fill"
                label="Fill colour"
                mode="hex"
                :modes="['hex', 'rgb']"
              >
                <template #prepend>
                  <v-icon :color="fill" icon="mdi-square" />
                </template>
                <template #append>
                  <v-btn
                    icon="mdi-undo-variant"
                    @click="fill = '#FFFFFF'"
                  />
                </template>
              </v-color-input>
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-color-input
                v-model="stroke"
                color-pip
                :icon-color="stroke"
                label="Stroke colour"
                mode="hex"
                :modes="['hex', 'rgb']"
              >
                <template #prepend>
                  <v-icon :color="stroke" icon="mdi-square" />
                </template>
                <template #append>
                  <v-btn
                    icon="mdi-undo-variant"
                    @click="stroke = '#FFFFFF'"
                  />
                </template>
              </v-color-input>
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-color-input
                v-model="corners"
                color-pip
                :icon-color="corners"
                label="Corner colour"
                mode="hex"
                :modes="['hex', 'rgb']"
              >
                <template #prepend>
                  <v-icon :color="corners" icon="mdi-square" />
                </template>
                <template #append>
                  <v-btn
                    icon="mdi-undo-variant"
                    @click="corners = '#6E1E41'"
                  />
                </template>
              </v-color-input>
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-slider
                v-model="opacity"
                label="Opacity"
                :max="1"
                :min="0"
                :step="0.01"
                thumb-label
              >
                <template #append>
                  <v-btn
                    icon="mdi-undo-variant"
                    @click="opacity = 0.25"
                  />
                </template>
              </v-slider>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          text="Cancel"
          @click="visible = false"
        />

        <v-spacer />

        <v-btn
          color="primary"
          prepend-icon="mdi-content-save"
          text="Save"
          variant="flat"
          @click="saveSettings"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { coreStore } from '@/stores/app'

  // COMPOSITION
  const store = coreStore()

  // REFS
  const visible = ref<boolean>(false)
  const fill = ref<string>('#00ff00')
  const corners = ref<string>('#00ff00')
  const stroke = ref<string>('#00ff00')
  const opacity = ref<number>(0.25)

  function show () {
    fill.value = store.polygonOptions.fill || '#00acef'
    corners.value = store.polygonOptions.corners || '#00acef'
    stroke.value = store.polygonOptions.stroke || '#00acef'
    opacity.value = store.polygonOptions.opacity || 0.25
    visible.value = true
  }
  function saveSettings () {
    store.setPolygonOptions({
      fill: fill.value,
      stroke: stroke.value,
      corners: corners.value,
      opacity: opacity.value,
    })

    visible.value = false
  }

  defineExpose({
    show,
  })
</script>

<style>
.settings .v-slider.v-input--horizontal {
  margin-inline: unset;
}
</style>
