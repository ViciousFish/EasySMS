<template>
  <div class="flex flex-column">
    <h1 class="m1">Download Reports</h1>
    <div class="p3 flex report-row"
      v-for="campaign in Object.keys(campaigns)"
      :key="campaign">
      <span class="status status-created" v-if="getCampaignStatus(campaigns[campaign].id)==='created'">Created</span>
      <span class="status status-in-progress" v-if="getCampaignStatus(campaigns[campaign].id)==='in-progress'">In progress</span>
      <span class="status status-completed" v-if="getCampaignStatus(campaigns[campaign].id)==='completed'">Completed</span>
      <span class="status status-deleted" v-if="getCampaignStatus(campaigns[campaign].id)==='deleted'">Deleted</span>
      <span class="block flex-auto">{{campaigns[campaign].name}}</span>
      <a v-if="campaigns[campaign].responses" :href="urljoin(API_URL, 'campaign', campaign, 'responses/file')"
        class="button px1 mr1">Response Report</a>
      <a v-if="campaigns[campaign].deliveries" :href="urljoin(API_URL, 'campaign', campaign, 'deliveries/file')"
        class="button px1">Delivery Report</a>
    </div>
    <h2 v-if="!campaigns">No campaigns to report on.
      <router-link to="/">Click here to create one!</router-link>
    </h2>
  </div>
</template>

<script>
import urljoin from "url-join";
import { API_URL } from "@/config";

export default {
  data() {
    return { API_URL };
  },
  mounted() {
    this.$store.dispatch("getCampaignsWithReports");
    this.$store.dispatch("fetchCampaigns");
  },
  destroyed() {
    this.$store.commit("CAMPAIGNS_WITH_REPORTS", {});
  },
  computed: {
    campaigns() {
      return this.$store.state.campaignsWithReports;
    },
    getCampaignStatus() {
      return campaignId => {
        console.log(campaignId);
        let camp = this.$store.getters.campaignById(campaignId);
        return camp ? camp.status : "deleted";
      };
    }
  },
  methods: {
    urljoin(...args) {
      return urljoin(args);
    }
  }
};
</script>

<style scoped>
.report-row {
  color: #333;
  border-bottom: 1px solid #999;
  background: white;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
.status {
  width: 100px;
}
.status-created {
  color: orange;
}
.status-in-progress {
  color: #08a;
}
.status-completed {
  color: #0a0;
}
.status-deleted {
  color: red;
}
.button {
  flex: 0 0 auto;
}
</style>
