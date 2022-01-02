const puppeteer = require('puppeteer');

module.exports = class Bot {
  /** @type {import('puppeteer').Browser} */
  browser;

  /** @type {import('puppeteer').Page} */
  page;

  /**
   * @typedef {Object} AutoCredentials Auto credentials
   * @prop {string} autoCredentials.username AutoLogin username
   * @prop {string} autoCredentials.password AutoLogin password
   */

  /** @type {AutoCredentials} */
  autoCredentials = {};

  /**
   * Create a bot instance
   * @param {import('puppeteer').LaunchOptions
   * & import('puppeteer').BrowserLaunchArgumentOptions
   * & import('puppeteer').BrowserConnectOptions
   * & {
   *  product?: import('puppeteer').Product
   *  extraPrefsFirefox?: Record<string, unknown>
   * }} options Browser options
   * @param {AutoCredentials} [autoCredentials] Auto credentials
   */
  async create(options, autoCredentials = {}) {
    this.browser = await puppeteer.launch({
      defaultViewport: {
        height: 902,
        // width: 1523,
        width: 1123,
      },
      ...options,
    });

    [this.page] = await this.browser.pages();
    this.autoCredentials = autoCredentials;

    this.page.on('load', () => {
      if (this.page.url().includes('/Login/Login')) this.login(this.autoCredentials.username, this.autoCredentials.password);
    });
  }

  async gotoHome() {
    this.page.goto('https://ldlc.com');
    await this.page.waitForFrame('https://www.ldlc.com/');
  }

  async gotoAccount() {
    await (await this.page.waitForSelector('a#compte')).evaluate((b) => b.click());
  }

  /**
   * Login to LDLC account
   * @param {string} email Account email
   * @param {string} password Account password
   */
  async login(email, password) {
    await this.page.waitForSelector('input#Email');
    await this.page.$eval('input#Email', (e, v) => { e.value = v; }, email);
    await this.page.$eval('input#Password', (e, v) => { e.value = v; }, password);
    await this.page.click('button[type=submit]');
  }

  /**
   * Go to item page
   * @param {string} item URL or Item ID
   * @param {boolean} skipData Skip data fetching
   */
  async gotoItem(item, skipData = false) {
    const url = (item.includes('://') ? item : `https://www.ldlc.com/fiche/${item}.html`);
    this.page.goto(url);
    await this.page.waitForSelector('h1.title-1');
    if (skipData) return {};
    return {
      name: (await (await this.page.$('h1.title-1')).evaluate((el) => el.textContent)).replace(/\n| {2,}/gim, ''),
      price: parseFloat((await (await this.page.$('aside>.price>.price')).evaluate((el) => el.textContent)).replace('€', '.').replace(/ /g, '')),
      stock: await (await this.page.$('.website>.content>.stock')).evaluate((el) => el.textContent),
    };
  }

  async addToCart(autoClose = false) {
    await (await this.page.waitForSelector('.add-to-cart-bloc>button.add-to-cart')).click();
    if (autoClose) await (await this.page.waitForSelector('#modal-mise-panier button.close')).click();
  }

  async gotoCart() {
    await (await this.page.waitForSelector('a#panier')).evaluate((b) => b.click());
    await this.page.waitForSelector('aside#order>.price');
    return {
      total: parseFloat((await (await this.page.$('aside#order>.price')).evaluate((el) => el.textContent)).replace('€', '.').replace(/ /g, '')),
    };
  }

  async orderCart() {
    // await (await this.page.waitForSelector('#form2>button')).click();
    await (await this.page.waitForSelector('#form2>button')).evaluate((b) => b.click());
  }

  /**
   * Fill the order form
   * @param {Object} options Delivery and payment options
   * @param {number} [options.deliveryHomeMode] Delivery mode (1: Standard, etc...)
   * @param {string} [options.deliveryRelayAddress] The relay address
   * @param {string} options.cardNumber Card number
   * @param {string} options.cardExpire Card expiration date
   * @param {string} options.cardCrypto Card cryptogram
   * @param {string} options.cardOwner Card owner name
   */
  async fillOrderForm(options = {}) {
    if (options.deliveryHomeMode) {
      // await this.page.waitForSelector('#deliveryModeClassicSelectionForm');
      // await this.page.waitForTimeout(500);
      // await this.page.click(`#deliveryModeClassicSelectionForm>.radio:nth-child(${options.deliveryHomeMode + 2})>input`);
    }
    if (options.deliveryRelayAddress) {
      await (await this.page.waitForSelector('#SearchAddress_AddressLine')).focus();
      await this.page.keyboard.type(`${options.deliveryRelayAddress}\n`, { delay: 100 });
      await (await this.page.waitForSelector('#form2>.actions>button')).evaluate((b) => b.click());
    }

    await this.page.waitForSelector('#CardNumber');
    await this.page.$eval('input#CardNumber', (e, v) => { e.value = v; }, options.cardNumber);
    await this.page.$eval('input#ExpirationDate', (e, v) => { e.value = v; }, options.cardExpire);
    await this.page.$eval('input#OwnerName', (e, v) => { e.value = v; }, options.cardOwner);
    await this.page.$eval('input#Cryptogram', (e, v) => { e.value = v; }, options.cardCrypto);
  }

  async refuseCookies() {
    await this.page.$eval('#cookieConsentRefuseButton', (e) => { e.click(); });
  }

  async acceptCookies() {
    await this.page.$eval('#cookieConsentAcceptButton', (e) => { e.click(); });
  }

  async close() {
    await this.browser.close();
  }
};
