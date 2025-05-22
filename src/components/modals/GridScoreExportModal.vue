<template>
  <v-dialog v-model="visible" max-width="720">
    <v-card title="Export to GridScore">
      <v-card-text>
        This window will let you export the vegetation index values extracted from your GridScore images back to GridScore.
      </v-card-text>

      <v-card-text>
        <v-form @submit.prevent="exportData">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="gridscoreUrl"
                label="GridScore URL"
                name="gridscore-url"
                required
                type="url"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="gridscoreShareCode"
                label="GridScore share code"
                name="gridscore-code"
                required
              />
            </v-col>
          </v-row>

          <v-row class="d-flex flex-column justify-center">
            <v-col class="mx-auto" cols="6">
              <v-btn
                block
                class="mb-5"
                :color="!trial ? 'primary' : null"
                prepend-icon="mdi-file-arrow-up-down-outline"
                text="Load trial information"
                @click="loadTrial"
              />

              <v-card
                v-if="trial"
                color="surface-variant"
                :subtitle="trial.description"
                :title="trial.name"
                variant="tonal"
              >
                <v-row class="mb-3">
                  <v-col cols="6">
                    <div class="text-center">
                      <h3><v-icon icon="mdi-table-column" /></h3>
                      <div>{{ trial.layout.columns }} columns</div>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-center">
                      <h3><v-icon class="rotate-90" icon="mdi-table-column" /></h3>
                      <div>{{ trial.layout.rows }} rows</div>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-center">
                      <h3><v-icon icon="mdi-tag-multiple-outline" /></h3>
                      <div>{{ trial.traits.length }} traits</div>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-center">
                      <h3><v-icon icon="mdi-account-outline" /></h3>
                      <div>{{ (trial.people || []).length }} people</div>
                    </div>
                  </v-col>
                  <v-col v-if="trial.updatedOn" cols="6">
                    <div class="text-center">
                      <h3><v-icon icon="mdi-calendar" /></h3>
                      <div>{{ trialDuration }} active days</div>
                    </div>
                  </v-col>
                  <v-col v-if="trial.updatedOn" cols="6">
                    <div class="text-center">
                      <h3><v-icon icon="mdi-calendar" /></h3>
                      <div>{{ formatTimeAgo(trial.updatedOn) }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <v-card-text>
                      <div v-if="!isAllowedToWrite">
                        <v-alert
                          text="The trial share code you used does not give you permission to write to this trial."
                          type="error"
                          variant="tonal"
                        />
                      </div>
                      <div v-else>
                        <v-select
                          v-if="numericTraitOptions"
                          v-model="selectedTrait"
                          hide-details
                          item-title="name"
                          item-value="id"
                          :items="numericTraitOptions"
                          label="Select trait"
                          return-object
                          single-line
                        />
                        <v-alert
                          v-else
                          text="No numeric traits found in this trial."
                          type="warning"
                          variant="tonal"
                        />
                      </div>
                    </v-card-text>
                  </v-col>
                </v-row>
              </v-card>
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
          :disabled="!isAllowedToWrite || !selectedTrait"
          prepend-icon="mdi-upload"
          text="Export"
          variant="flat"
          @click="exportData"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { Tab } from '@/pages/index.vue'
  import { formatTimeAgo, getGridScoreColumnIndex, getGridScoreRowIndex, toLocalDateString } from '@/plugins/util'
  import type { Trait, Trial } from '@/types/gridscore'
  import axios, { type AxiosResponse } from 'axios'
import { TraitMeasurement } from '../../types/gridscore'

  export interface Options {
    images?: Tab[]
  }

  const props = withDefaults(defineProps<Options>(), {
    images: () => [],
  })

  const selectedTrait = ref<Trait>()
  const trial = ref<Trial>()
  const visible = ref<boolean>(false)
  const gridscoreUrl = ref<string>('https://gridscore.hutton.ac.uk')
  const gridscoreShareCode = ref<string>()

  const isAllowedToWrite: ComputedRef<boolean | undefined> = computed(() => {
    if (trial.value && trial.value.shareCodes) {
      return (trial.value.shareCodes.ownerCode !== undefined && trial.value.shareCodes.ownerCode !== null) || (trial.value.shareCodes.editorCode !== undefined && trial.value.shareCodes.editorCode !== null)
    } else {
      return undefined
    }
  })

  const numericTraitOptions: ComputedRef<Trait[]> = computed(() => {
    if (trial.value && trial.value.traits) {
      return trial.value.traits.filter(t => t.dataType === 'int' || t.dataType === 'float' || t.dataType === 'range')
        .sort((a, b) => a.name.localeCompare(b.name))
    } else {
      return []
    }
  })

  const trialDuration: ComputedRef<number> = computed(() => {
    if (trial.value && trial.value.createdOn && trial.value.updatedOn) {
      const start = toLocalDateString(trial.value.createdOn)
      const end = toLocalDateString(trial.value.updatedOn)

      return (new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000) + 1
    } else {
      return 1
    }
  })

  const gridscoreFullUrl: ComputedRef<string | undefined> = computed(() => {
    if (gridscoreUrl.value) {
      let remote = gridscoreUrl.value

      if (!remote) {
        return
      }
      if (!remote.endsWith('/')) {
        remote += '/'
      }
      if (remote && !remote.endsWith('api/')) {
        remote += 'api/'
      }

      return remote
    } else {
      return undefined
    }
  })

  watch(numericTraitOptions, async newValue => {
    if (newValue && newValue.length > 0) {
      selectedTrait.value = newValue[0]
    }
  })

  function show () {
    trial.value = undefined
    selectedTrait.value = undefined
    gridscoreShareCode.value = undefined
    visible.value = true
  }
  function loadTrial () {
    // @ts-ignore
    axios.default({
      url: `${gridscoreFullUrl.value}trial/${gridscoreShareCode.value}`,
      method: 'get',
      crossDomain: true,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    }).then((t: AxiosResponse) => {
      trial.value = t?.data
    }).catch((err: any) => {
      // TODO
      console.error(err)
    })
  }
  function exportData () {
    if (!selectedTrait.value) {
      return
    }

    const data: { [index: string]: TraitMeasurement[] } = {}

    props.images.forEach(i => {
      const gg = i.gridscoreConfig

      if (!gg) {
        return
      }

      data[`${getGridScoreRowIndex(trial.value?.layout, gg.row)}|${getGridScoreColumnIndex(trial.value?.layout, gg.column)}`] = [{
        traitId: selectedTrait.value?.id || '',
        values: [`${i.ratio}`],
        timestamp: i.gridscoreConfig?.timestamp || new Date().toISOString(),
      }]
    })

    const transaction = {
      plotTraitDataChangeTransactions: data,
    }

    // @ts-ignore
    axios.default({
      url: `${gridscoreFullUrl.value}trial/${gridscoreShareCode.value}/transaction`,
      method: 'post',
      crossDomain: true,
      data: transaction,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    }).then((t: AxiosResponse) => {
      console.log(t)
    }).catch((err: any) => {
      // TODO
      console.error(err)
    })
  }

  defineExpose({
    show,
  })
</script>
