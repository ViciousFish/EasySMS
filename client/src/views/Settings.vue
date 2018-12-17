<template>
  <div>
    <h1 class="m1">Settings</h1>
  </div>
</template>

<script>
export default {
  name: 'settings',
  mounted() {
    this.$store.dispatch('fetchTwilio');
  },
}
</script>
