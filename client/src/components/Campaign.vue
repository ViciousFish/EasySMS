<template>
<div class="main">
    <span class="status-created" v-if="campaign.status==='created'">Created</span>
    <span class="status-in-progress" v-if="campaign.status==='in-progress'">In progress</span>
    <span class="status-completed" v-if="campaign.status==='completed'">Completed</span>
    <router-link class="p3"
      :to="`/${campaign.id}/edit`">
    {{campaign.name}}
    </router-link>
    <div style="float:right;">
        <transition name="fade" mode="out-in">
            <button
            key="firstDelete"
            v-if="!confirmDelete"
            v-on:click="(e) => {
                e.preventDefault();
                deleteButtonClicked();
            }"
            class="delete-button">
            Delete
            </button>
            <button
            key="secondDelete"
            v-if="confirmDelete"
            v-on:click="(e) => {
                e.preventDefault();
                deleteCampaign();
            }"
            class="delete-button">
            Confirm
            </button>
        </transition>
    </div>
</div>
</template>

<script>
export default {
  props: ["campaign"],

  data() {
    return {
      confirmDelete: false
    };
  },
  methods: {
    deleteButtonClicked() {
      this.confirmDelete = true;
    },
    deleteCampaign() {
      this.$store.dispatch("deleteCampaign", this.campaign.id);
    }
  }
};
</script>

<style scoped>
.main {
  /* display: flex; */
  /* padding: 5px; */
  color: #333;
  border-bottom: 1px solid #999;
  background: white;
  text-decoration: none;
}
a {
  color: #333;
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
  color: #08a;
}
.status-completed {
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
