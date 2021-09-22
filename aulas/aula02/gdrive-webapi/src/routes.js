import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { logger } from './logger.js';
import FileHelper from './fileHelper.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDownloadsFolder = resolve(__dirname, '..', 'downloads');

export default class Routes {

  io;

  constructor(dowloadsFolder = defaultDownloadsFolder) {
    this.dowloadsFolder = dowloadsFolder;
    this.fileHelper = FileHelper;
  }

  setSocketInstance(io) {
    this.io = io;
  }

  async defaultRoute(request, response) {
    response.end('hello world');
  }

  async options(request, response) {
    response.writeHead(204);
    response.end();
  }

  async post(request, response) {
    logger.info('Route post ->');

    response.end();
  }

  async get(request, response) {
    const files = await this.fileHelper.getFileStatus(this.dowloadsFolder);

    response.writeHead(200);
    response.end(JSON.stringify(files));
  }

  async handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');

    const chosen = this[request.method.toLowerCase()] || this.defaultRoute;
    return chosen.apply(this, [request, response]);
  }
}