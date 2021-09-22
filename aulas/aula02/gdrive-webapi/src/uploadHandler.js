import Busboy from 'busboy';
import fs from 'fs';
import { pipeline } from 'stream/promises';

import { logger } from './logger';

export default class UploadHandler {
  constructor({ io, socketId, downloadsFolder }) {
    this.io = io;
    this.socketId = socketId;
    this.downloadsFolder = downloadsFolder;

    this.ON_UPLOAD_EVENT = 'file';
  }

  handleFileBytes(filename) {
    async function* handleData(source) {
      let processedAlready = 0;

      for await (const chunk of source) {
        yield chunk;

        processedAlready += chunk.length;

        this.io.to(this.socketId).emit(this.ON_UPLOAD_EVENT, { processedAlready, filename });
        logger.info(`File [${filename}] got ${processedAlready} bytes to ${this.socketId}`);
      }
    }

    return handleData.bind(this);
  }

  async onFile(fieldname, file, filename) {
    const saveTo = `${this.downloadsFolder}/${filename}`

    await pipeline(
      // get readable stream
      file,
      // filter, convert and transform data
      this.handleFileBytes.apply(this, [filename]),
      // endend of process -> writable stream
      fs.createWriteStream(saveTo)
    );

    logger.info(`File [${filename}] finished`);
  }

  registerEvents(headers, onFinish) {
    const busboy = new Busboy({ headers });

    busboy.on('file', this.onFile.bind(this));
    busboy.on('finish', onFinish);

    return busboy;
  }
}