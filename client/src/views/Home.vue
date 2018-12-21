<template>
  <div class="home">
    <h1 class="m1">{{authenticated ? "Good Evening" : "Authenticating..."}}.</h1>
  </div>
</template>

<script>
export default {
  name: 'home',
  computed: {
    authenticated() {
      return this.$store.state.authenticated;
    }
  }
};
</script>
<style lang="scss" scoped>
.home {
  box-sizing: border-box;
  height: 100vh;
  // padding-left: 40px !important;
  // padding: 0 !important;
}
</style>
