<template>
  <div class="flex flex-column">
    <h1 class="m1">My Campaigns</h1>
    <router-link class="p3"
      v-for="campaign in Object.values(campaigns)"
      :key="campaign.id"
      :to="`/${campaign.id}/edit`">
      <span class="status-created" v-if="campaign.status==='created'">.</span>
      <span class="status-in-progress" v-if="campaign.status==='in-progress'">.</span>
      {{campaign.name}}
      <button
        v-on:click="(e) => {
          e.preventDefault();
          deleteCampaign(campaign.id);
        }"
        style="background-color:#f64949;float:right;border-radius:50%;border:none;width:25px;height:25px;">
        X
      </button>
    </router-link>
    <router-link class="p3" to="/new">+ new</router-link>
  </div>
</template>

<script>
export default {
  mounted() {
    this.$store.dispatch('fetchCampaigns');
  },
  computed: {
    campaigns() {
      return this.$store.state.campaignMap;
    },
  },
  methods: {
    deleteCampaign(campaignId) {
      this.$store.dispatch('deleteCampaign', campaignId);
    }
  }
};
</script>

<style scoped>
a {
  /* display: flex; */
  /* padding: 5px; */
  color: #333;
  border-bottom: 1px solid #999;
  background: white;
  text-decoration: none;
}
a:hover{
  /* color: #666; */
  text-decoration: underline;
  /* background: #EFEFEF; */
}
span {
  display:inline-block;
  height: 30px;
  width: 30px;
  border-radius: 50%;
}
.status-created {
  background: orange;
  color: orange;
}
.status-in-progress {
  background: #0a0;
  color: #0a0;
}
</style>
