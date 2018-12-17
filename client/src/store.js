import Vue from 'vue';
import Vuex from 'vuex';
import urljoin from 'url-join';
import axios from 'axios';
import papa from 'papaparse';
import { API_URL } from './config';
import router from './router';

Vue.use(Vuex);

const HOME_URL = API_URL.substring(0, API_URL.length - 3);
const axiosInstance = axios.create({ withCredentials: true, baseURL: HOME_URL });

axiosInstance.interceptors.response.use(null, ({ response }) => {
  if (response.status === 403) {
    window.location = `${HOME_URL}login?returnTo=${window.location}`;
  }
  if (response.status === 422) {
    // TODO: implement this
    console.log("User has no twilio credentials");
    router.push('/settings');
  }
  return response;
});

export default new Vuex.Store({
  state: {
    campaignMap: {},
    messageMap: {},
    inputcsv: {},
  },
  mutations: {
    newCampaign(state, campaign) {
      Vue.set(state.campaignMap, campaign.id, campaign);
    },
    RECEIVE_CAMPAIGNS(state, campaigns) {
      campaigns.forEach((campaign) => {
        Vue.set(state.campaignMap, campaign.id, campaign);
      });
    },
    RECEIVE_NEW_MESSAGE(state, { campaign, message }) {
      state.campaignMap[campaign].messages.push(message);
    },
    RECEIVE_TWILIO_INFORMATION(state, twilioInformation) {
      console.log(twilioInformation);
    },
  },
  getters: {
    campaignById: state => id => state.campaignMap[id],
  },
  actions: {
    async parse(context, { file }) {
      return new Promise((resolve, reject) => {
        papa.parse(file, {
          complete: (data) => {
            const objlist = data.data.map(row => (row[0].length > 0 ? {
              name: row[0],
              phone: row[1],
              email: row[2],
            } : null)).filter(item => item);
            resolve(objlist);
          },
          error: (e) => {
            reject(e);
          },
        });
      });
    },
    async newCampaign(context, { name, users }) {
      const newCampaign = (await axiosInstance.post(urljoin('api/campaign'), {
        name,
        users,
      })).data;

      context.commit('newCampaign', newCampaign);
      return newCampaign.id;
      // make API call
      // commit new campaign
    },
    async fetchCampaigns(context) {
      const campaigns = (await axiosInstance.get('api/campaign')).data;
      if (campaigns) {
        context.commit('RECEIVE_CAMPAIGNS', campaigns);
      }
    },
    async sendCampaign(context, { campaign }) {
      return axiosInstance.post(urljoin('api/campaign', campaign, 'start'), {});
    },
    async newMessage(context, { message, campaign }) {
      const payload = {
        text: message.text,
        date: message.date.getTime(),
        campaignId: campaign,
      };
      const newMessage = (await axiosInstance.post(urljoin(`api/campaign/${campaign}/message`), payload)).data;
      context.commit('RECEIVE_NEW_MESSAGE', { message: newMessage, campaign });
      return newMessage;
    },
    async fetchTwilio(context) {
      const twilioInformation = (await axiosInstance.get('api/twiliocredentials')).data;
      console.log(twilioInformation);
      context.commit('RECEIVE_TWILIO_INFORMATION', twilioInformation);
    },
  },
});
