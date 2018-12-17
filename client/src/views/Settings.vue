<template>
  <div>
    <h1 class="m1">Settings</h1>
    <div v-if="!twilioInformation.exists">We need your twilio credentials to send text messages.</div>
    <a href="https://twilio.com">Set up a twilio account</a>
    <form class="mt2 flex flex-column">
      <h2 class="my1">Your twilio account information</h2>
      <div class="form-group flex flex-row flex-auto mt1">
        <label for="account_sid">Account ID</label>
        <input name="account_sid" id="account_sid" class="flex-auto ml1" type="text">
      </div>
      <div class="form-group flex flex-row flex-auto mt1">
        <label for="auth_token">Auth token</label>
        <input name="auth_token" id="auth_token" class="flex-auto ml1" type="text">
      </div>
      <div class="form-group flex flex-row flex-auto mt1">
        <label for="phone">Phone number</label>
        <input name="phone" id="phone" class="flex-auto ml1" type="text">
      </div>
    </form>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "settings",
  mounted() {
    this.$store.dispatch("fetchTwilio");
  },
  computed: mapState({
    twilioInformation: state => state.twilioInformation
  })
};
</script>

<style scoped>
form {
  max-width: 560px;
}
</style>