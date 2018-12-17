<template>
  <div>
    <h1 class="m1">Settings</h1>
    <div v-if="!twilioInformation.exists">
      We need your twilio credentials to send text messages.
    </div>
    <input type="text" />
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'settings',
  mounted() {
    this.$store.dispatch('fetchTwilio');
  },
  computed: mapState({
    twilioInformation: state => state.twilioInformation
  })
}
</script>
