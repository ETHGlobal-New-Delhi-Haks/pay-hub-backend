import axios, {AxiosInstance} from "axios";


class OneInchRateLimiter {
  public queue: any[];
  public isProcessing: boolean;
  public lastRequestTime: number;
  public MIN_INTERVAL: number;

  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.MIN_INTERVAL = 2000; // 2 sec between requests
  }

  async enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const now = Date.now();
    const timeToWait = Math.max(0, this.MIN_INTERVAL - (now - this.lastRequestTime));

    await new Promise(resolve => setTimeout(resolve, timeToWait));

    const { fn, resolve, reject } = this.queue.shift();

    try {
      this.lastRequestTime = Date.now();
      const result = await fn();
      resolve(result);
      this.processQueue();
    } catch (error) {
      reject(error);
      this.processQueue();
    }
  }
}


export class Inch {
  private strapi: any;
  public rateLimiter: OneInchRateLimiter;
  private client: AxiosInstance;

  constructor(strapi: any) {
    this.strapi = strapi;

    const baseURL = strapi.config.get('inch.INCH_ENDPOINT')
    const token = strapi.config.get('inch.INCH_TOKEN');
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    this.rateLimiter = new OneInchRateLimiter();
  }

  async loadTokensFromUser(type: string, walletAddress: string) {
    const balances = {};

    switch (type) {
      case 'evm':
        balances['0'] = await this.loadTokens(1, walletAddress);
        balances['137'] = await this.loadTokens(137, walletAddress);
        balances['42161'] = await this.loadTokens(42161, walletAddress);
        break;
      case 'solana':
        balances['501'] = await this.loadTokens(501, walletAddress);
    }

    return balances;
  }

  async loadTokens(chain: number, walletAddress: string) {
    return await this.rateLimiter.enqueue(async () => {
      try {
        const { data } = await this.client.get(`/balance/v1.2/${chain}/balances/${walletAddress}`);

        return data;

      } catch (error) {
        console.error('Error getting tokens by address:', error.response?.data || error.message);
        throw error;
      }
    })
  }

  async loadInfoAboutTokens(chain: number) {
    return await this.rateLimiter.enqueue(async () => {
      try {
        const { data } = await this.client.get(`/token/v1.2/${chain}/token-list`);

        return data;

      } catch (error) {
        console.error('Error getting tokens by address:', error.response?.data || error.message);
        throw error;
      }
    })
  }
}
