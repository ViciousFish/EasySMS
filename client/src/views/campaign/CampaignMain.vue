<template>
  <div class="flex flex-column">
    <h1 class="m1">My Campaigns</h1>
    <h2 class="m1">See the status of your campaigns, create new campaigns, or edit/delete existing ones</h2>
    <transition-group name="list" tag="div">
    <campaign class="p3"
      v-for="campaign in Object.values(campaigns)"
      :key="campaign.id"
      :campaign="campaign">
    </campaign>
    </transition-group>
    <router-link class="p3" to="/new">+ new</router-link>
  </div>
</template>

<script>
import Campaign from "../../components/Campaign";

export default {
  mounted() {
    this.$store.dispatch("fetchCampaigns");
  },
  computed: {
    campaigns() {
      return this.$store.state.campaignMap;
    }
  },
  methods: {
    deleteButtonClicked() {
      this.stage1Delete = false;
    },
    deleteCampaign(campaignId) {
      this.$store.dispatch("deleteCampaign", campaignId);
    }
  },
  components: {
    Campaign
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
a:hover {
  /* color: #666; */
  text-decoration: underline;
  /* background: #EFEFEF; */
}
span {
  display: inline-block;
  height: 30px;
  width: 100px;
  border-radius: 0%;
}
.status-created {
  color: orange;
}
.status-in-progress {
  color: #0a0;
}
.delete-button {
  background: none;
  color: red;
  border: none;
  font-size: 15px;
  width: 40px;
  height: 25px;
}
.list-item {
  display: inline-block;
  margin-right: 10px;
}
.list-enter-active,
.list-leave-active {
  transition: all 1s;
}
.list-enter, .list-leave-to /* .list-leave-active below version 2.1.8 */ {
  opacity: 0;
  transform: translateX(100px);
}
</style>
