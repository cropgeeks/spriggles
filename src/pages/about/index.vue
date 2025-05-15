<template>
  <v-container class="pt-12">
    <v-row class="align-center justify-center">
      <v-col :cols="12" :lg="3" :md="4">
        <v-img max-height="300px" src="@/assets/spriggles.svg" />
      </v-col>
      <v-col class="text-center text-md-start" :cols="12" :lg="9" :md="8">
        <h1 class="text-h2 font-weight-medium mb-3 ms-n1">Spriggles</h1>
        <div class="mb-5 mx-auto ms-lg-0">
          <p>Spriggles is a mobile, fast and user-friendly tool for estimating the ratio of green foliage/vegetation against the background of an image.</p>
          <p>Spriggles has been developed by <a href="https://www.hutton.ac.uk/staff/sebastian-raubach">Sebastian Raubach</a>. Fraser Macfarlane, Joanne Russel, Sidsel Birkelund Schmidt and Paul Shaw have been instrumental in testing Spriggles. If you have any questions, suggestions or general feedback, please contact <a href="mailto:sebastian.raubach@hutton.ac.uk">Sebastian</a>.</p>
          <p>We are utilising the vegetation formula presented in: <a href="https://doi.org/10.2134/agronj15.0150">Canopeo: A Powerful New Tool for Measuring Fractional Green Canopy Cover</a> by Andres Patrignani and Tyson E. Ochsner.</p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
</script>

<style>
</style>
