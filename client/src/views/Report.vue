<template>
  <div class="flex flex-column">
    <h1 class="m1">Download Reports</h1>
    <div class="p3 flex report-row"
      v-for="campaign in Object.values(campaigns)"
      :key="campaign.id"
      :to="`/campaign/${campaign.id}/edit`">
      <span class="status-created" v-if="campaign.status==='created'">.</span>
      <span class="status-in-progress" v-if="campaign.status==='in-progress'">.</span>
      <span class="block flex-auto">{{campaign.name}}</span>
      <a :href="urljoin(API_URL, 'campaign', campaign.id, 'responses/file')"
        class="button px1 mr1">Response Report</a>
      <a :href="urljoin(API_URL, 'campaign', campaign.id, 'deliveries/file')"
        class="button px1">Delivery Report</a>
    </div>
    <h2 v-if="!campaigns">No campaigns to report on. <router-link to="/">Click here to create one!</router-link></h2>
  </div>
</template>

<script>
import urljoin from 'url-join';
import { API_URL } from '@/config';

export default {
  data() {
    return { API_URL };
  },
  mounted() {
    this.$store.dispatch('fetchCampaigns');
  },
  computed: {
    campaigns() {
      return this.$store.state.campaignMap;
    },
  },
  methods: {
    urljoin(...args) {
      return urljoin(args);
    },
  },
};
</script>

<style scoped>
.report-row {
  color: #333;
  border-bottom: 1px solid #999;
  background: white;
  text-decoration: none;
}
a:hover{
  text-decoration: underline;
}
.status-created {
  background: orange;
  color: orange;
}
.status-in-progress {
  background: #0a0;
  color: #0a0;
}
.button {
  flex: 0 0 auto;
}
</style>
