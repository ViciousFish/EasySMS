import Vue from 'vue';
import Vuex from 'vuex';
import urljoin from 'url-join';
import axios from 'axios';
import papa from 'papaparse';
import { API_URL, BYPASS_TWILIO_CHECK } from './config';
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
    router.push('/settings');
  }
  return response;
});

export default new Vuex.Store({
  state: {
    campaignsWithReports: {},
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
      state.campaignMap = {}; // eslint-disable-line
      campaigns.forEach((campaign) => {
        Vue.set(state.campaignMap, campaign.id, campaign);
        campaign.messages.forEach((message) => {
          Vue.set(state.messageMap, message.uuid, message);
        });
      });
    },
    RECEIVE_NEW_MESSAGE(state, { campaign, message }) {
      state.campaignMap[campaign].messages.push(message);
      Vue.set(state.messageMap, message.uuid, message);
    },
    RECEIVE_TWILIO_INFORMATION(state, twilioInformation) {
      Vue.set(state, 'twilioInformation', twilioInformation);
    },
    CAMPAIGNS_WITH_REPORTS(state, campaigns) {
      Vue.set(state, 'campaignsWithReports', campaigns);
    },
    setAuthenticated(state, isAuthenticated) {
      state.authenticated = isAuthenticated; // eslint-disable-line
    },
    setSavingCredentials(state, isSaving) {
      state.savedCredentials = isSaving; // eslint-disable-line
    },
    UPDATE_MESSAGE(state, { message, campaignId }) {
      const foundIndex = state.campaignMap[campaignId].messages.reduce((index, m, currentIndex) => {
        if (index) {
          return index;
        } else if (m.uuid === message.uuid) {
          return currentIndex;
        }
        return null;
      }, null);
      const { messages } = state.campaignMap[campaignId];
      if (foundIndex !== null) {
        messages[foundIndex] = message;
      }
      Vue.set(state.campaignMap[campaignId], 'messages', messages);
      Vue.set(state.messageMap, message.uuid, message);
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
              .filter(item => item) // idk apparently this line is necessary
              //  remove parentheses, whitespace and dashes
              .map(item => item.replace(/[\(\)\-\s]/g, '')) // eslint-disable-line no-useless-escape
              .filter((value, index, self) => self.indexOf(value) === index); // remove duplicates
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
      let campaigns = (await axiosInstance.get('api/campaign')).data;
      if (campaigns) {
        campaigns = campaigns.sort(({ date: date1 }, { date: date2 }) => {
          return date1 < date2
        });
        context.commit('RECEIVE_CAMPAIGNS', campaigns);
      }
    },
    async getCampaignsWithReports(context) {
      const campaigns = (await axiosInstance.get('api/campaign/reports')).data;
      if (campaigns) {
        context.commit('CAMPAIGNS_WITH_REPORTS', campaigns);
      }
    },
    async sendCampaign(context, { campaign }) {
      return axiosInstance.post(urljoin('api/campaign', campaign, 'start'), {});
    },
    async deleteCampaign({ dispatch }, campaignId) {
      axiosInstance.delete(urljoin('api/campaign/', campaignId))
        .then(() => {
          dispatch('fetchCampaigns');
        }).catch(() => {

        });
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
    async updateMessage(context, { message, campaignId }) {
      const payload = {
        text: message.text,
        date: message.date.getTime(),
        campaignId,
      };

      const updatedMessage = (await axiosInstance.put(urljoin(`api/campaign/${campaignId}/message/${message.uuid}`), payload)).data;
      context.commit('UPDATE_MESSAGE', {
        message: updatedMessage,
        campaignId,
      });
    },
    async fetchTwilio(context) {
      const response = (await axiosInstance.get('api/twiliocredentials'));
      const twilioInformation = (response.status === 404) ? {
        exists: false,
      } : {
          exists: true,
          ...response.data,
        };
      context.commit('RECEIVE_TWILIO_INFORMATION', twilioInformation);
    },
    async submitTwilioCredentials(context, twilioInformation) {
      const response = await axiosInstance.post('api/twiliocredentials', twilioInformation);
      if (response.status === 201) {
        context.commit('setSavingCredentials', true);
        setTimeout(() => {
          context.commit('setSavingCredentials', false);
        }, 2000);
      }
    },
    async login() {
      window.location = `${HOME_URL}login?returnTo=${window.location}`;
    },
  },
});
