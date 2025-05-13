<template>
  <v-app>
    <v-main>
      <v-app-bar :elevation="2">
        <v-img
          id="logo"
          class="ms-4"
          contain
          max-height="64"
          max-width="64"
          src="@/assets/spriggles-full.svg"
        />

        <v-app-bar-title style="cursor: pointer" @click="$router.push('/')">Spriggles</v-app-bar-title>
        <v-spacer />
      </v-app-bar>

      <v-container class="app-content">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  //
</script>
