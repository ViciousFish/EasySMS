<template>
  <div class="flex flex-column">
    <transition name="fade">
      <div class="flex flex-column" v-if="!parsing && !users">
        <label for="campaign-name">Campaign Name</label>
        <input class="p2 m1 h3 flex-auto"
          id="campaign-name"
          name="campaign-name"
          type="text"
          v-model="campaignName"
          placeholder="Something descriptive to help you find it in the future"
          autofocus
          required/>
        <label for="csv">Phone Number .csv</label>
        <input name="csv" id="csv" class="m1 h4" type="file" ref="file" accept="text/csv">
        <div>
          <transition name="fade">
            <div v-if="this.campaignName != ''" @click="processFile" class="button py1 px2 m1">
              next
            </div>
          </transition>
        </div>
      </div>
      <div v-if="parsing">pretend this is a loading spinner</div>
      <div v-if="!parsing && users" class="m1">
        Preview of phone numbers:
        <pre>{{users}}</pre>
        <div>
          <div @click="commitNewCampaign" class="button btn-success py1 px2 m1">
            My data looks good
          </div>
          <div @click="startOver" class="button py1 px2 m1">
            I need to change something
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      campaignName: '',
      users: null,
      parsing: false,
      pushing: false,
      stage: 0,
    };
  },
  methods: {
    processFile() {
      if (this.campaignName === '' || this.campaignName === null){
        return;
      }
      const file = this.$refs.file.files[0];
      this.users = this.$store
        .dispatch('parse', {
          file,
        })
        .then((users) => {
          this.parsing = false;
          this.users = users;
        });
      this.parsing = true;
    },
    startOver() {
      this.users = null;
    },
    async commitNewCampaign() {
      this.pushing = true;
      const id = await this.$store.dispatch('newCampaign', {
        users: this.users.map(user => ({ phone: user})),
        name: this.campaignName,
      });

      this.$router.push(`/${id}/edit`);
    },
  },
};
</script>

<style>
input[type="text"] {
  border-width: 0 0 1px 0;
}
.button {
  flex: 1 0 auto;
  float: left;
}

pre {
  max-height: 400px;
  overflow: auto;
  padding: 1em;
  background: rgb(250, 250, 250);
  border: 1px solid #aaa;
  border-radius: 3px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
