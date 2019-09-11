const SEIZA_URL = process.env.SEIZA_URL || 'http://localhost:3001';
export default {
  version: '1.9.0',
  name: 'Yoroi',
  manifest_version: 2,
  description: 'A simple, secure and fast Cardano ADA wallet.',
  browser_action: {
    default_title: 'Yoroi',
    default_icon: {
      16: 'img/icon-16.png',
      48: 'img/icon-48.png',
      128: 'img/icon-128.png',
    },
  },
  browser_specific_settings: {
    gecko: {
      id: '{530f7c6c-6077-4703-8f71-cb368c663e35}',
    },
  },
  icons: {
    16: 'img/icon-16.png',
    48: 'img/icon-48.png',
    128: 'img/icon-128.png',
  },
  background: {
    page: 'background.html',
  },
  permissions: ['storage', '*://connect.trezor.io/*'],
  content_scripts: [
    {
      matches: ['*://connect.trezor.io/*/popup.html'],
      js: ['js/trezor-content-script.js'],
    },
  ],
  content_security_policy:
    `default-src 'self'; frame-src ${SEIZA_URL} https://connect.trezor.io/ https://emurgo.github.io/yoroi-extension-ledger-bridge; script-src 'self' 'unsafe-eval' blob:; connect-src https://iohk-mainnet.yoroiwallet.com wss://iohk-mainnet.yoroiwallet.com:443; style-src * 'unsafe-inline' 'self' blob:; img-src 'self' data:;`,
  protocol_handlers: [
    {
      protocol: 'web+cardano',
      name: 'Yoroi',
      uriTemplate: 'main_window.html#/send-from-uri?q=%s',
    },
  ],
};
