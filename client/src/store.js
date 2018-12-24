import Vue from 'vue';
import Vuex from 'vuex';
import urljoin from 'url-join';
import axios from 'axios';
import papa from 'papaparse';
import { API_URL } from './config';
import router from './router';
// import * as R from 'ramda';

Vue.use(Vuex);

const HOME_URL = API_URL.substring(0, API_URL.length - 3);
const axiosInstance = axios.create({ withCredentials: true, baseURL: HOME_URL });


axiosInstance.interceptors.response.use(null, ({ response }) => {
  if (response.status === 401) {
    window.location = `${HOME_URL}login?returnTo=${window.location}`;
  }
  if (response.status === 403) {
    // TODO: implement this
    // console.log("User has no twilio credentials");
    router.push('/settings');
  }
  return response;
});

export default new Vuex.Store({
  state: {
    campaignMap: {},
    messageMap: {},
    inputcsv: {},
    twilioInformation: {
      exists: false,
      account_sid: '',
      auth_token: '',
      phone: '',
    },
    authenticated: false,
    savedCredentials: false,
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
      Vue.set(state, 'twilioInformation', twilioInformation);
    },
    setAuthenticated(state, isAuthenticated) {
      state.authenticated = isAuthenticated; // eslint-disable-line
    },
    setSavingCredentials(state, isSaving) {
      state.savedCredentials = isSaving; // eslint-disable-line
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
            const objlist = data.data
              .map(row => (row[0].length > 0 ? row[0] : null))
              .filter(item => item);
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
      const response = (await axiosInstance.get('api/twiliocredentials'));
      console.log(response);
      const twilioInformation = (response.status === 404) ? {
        exists: false,
      } : {
        exists: true,
        ...response.data,
      };
      console.log('twilioInformation', twilioInformation);
      context.commit('RECEIVE_TWILIO_INFORMATION', twilioInformation);
    },
    async submitTwilioCredentials(context, twilioInformation) {
      console.log('abt to send', twilioInformation);
      const response = await axiosInstance.post('api/twiliocredentials', twilioInformation);
      console.log(response);
      context.commit('setSavingCredentials', true);
      setTimeout(() => {
        context.commit('setSavingCredentials', false);
      }, 2000);
    },
    async login() {
      window.location = `${HOME_URL}login?returnTo=${window.location}`;
    },
  },
});
