<template>
  <div>
    <h1 class="m1">Settings</h1>
    <div v-if="!twilioInformation.exists">We need your twilio credentials
      to send text messages.</div>
    <a v-if="!twilioInformation.exists" href="https://twilio.com">Set up a twilio account</a>
    <form v-if="!loading" class="mt2 flex flex-column" @submit="submitCredentials">
      <h2 class="my1">Your twilio account information</h2>
      <h6 v-if="twilioInformation.exists">For security purposes, we'll only show the last
        four characters of your Twilio credentials</h6>
      <div class="form-group flex flex-row flex-auto mt1">
        <label for="account_sid">Account ID</label>
        <input
          class="flex-auto ml1"
          name="account_sid"
          id="account_sid"
          type="text"
          v-model="twilioInformation.account_sid"
        >
      </div>
      <div class="form-group flex flex-row flex-auto mt1">
        <label for="auth_token">Auth token</label>
        <input
          class="flex-auto ml1"
          name="auth_token"
          id="auth_token"
          type="text"
          v-model="twilioInformation.auth_token"
        >
      </div>
      <div class="form-group flex flex-row flex-auto mt1">
        <label for="phone">Phone number</label>
        <input
          class="flex-auto ml1"
          name="phone"
          id="phone"
          type="tel"
          v-model="twilioInformation.phone"
        >
      </div>
      <div class="form-group mt1">
        <input type="submit" class="button btn-success py1 px2 my1" value="Save">
      </div>
      <transition name="slide-fade">
        <p v-if="saved">Saved!</p>
      </transition>
    </form>
  </div>
</template>

<script>
export default {
  name: 'settings',
  data() {
    return {
      loading: true,
      twilioInformation: {
        exists: false,
        account_sid: '',
        auth_token: '',
        phone: '',
      },
    };
  },
  async mounted() {
    await this.$store.dispatch('fetchTwilio');
    // console.log(this.loading);
    this.$set(this, 'twilioInformation', this.$store.state.twilioInformation);
    this.loading = false;
  },
  methods: {
    submitCredentials(e) {
      e.preventDefault();
      // console.log("submit", this.twilioInformation);
      this.$store.dispatch('submitTwilioCredentials', this.twilioInformation);
    },
  },
  computed: {
    saved() {
      return this.$store.state.savedCredentials;
    },
  },
};
</script>

<style scoped>
form {
  max-width: 560px;
}

.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}
</style>
