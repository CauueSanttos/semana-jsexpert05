import fs from 'fs';
import { pipeline } from 'stream/promises';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

import UploadHandler from './../../src/uploadHandler.js';
import { logger } from './../../src/logger.js';
import TestUtil from '../_util/testUtil.js';

describe('#UploadHandler test suite', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {}
  };

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation();
  });

  describe('#registerEvents', () => {
    test('should call onFile and onFinish functions on Busboy instance', () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01',
      });

      jest.spyOn(uploadHandler, uploadHandler.onFile.name)
        .mockResolvedValue();

      const headers = {
        'content-type': 'multipart/form-data; boundary=',
      }

      const onFinish = jest.fn();
      const busboyInstance = uploadHandler.registerEvents(headers, onFinish);
      const fileStream = TestUtil.generateReadableStream(['chunk', 'of', 'data']);

      busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt');
      busboyInstance.listeners('finish')[0].call();

      expect(uploadHandler.onFile).toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalled();
    })
  });

  describe('#onFile', () => {
    test('given a stream file it should save it on disk', async () => {
      const chunks = ['hey', 'dude'];
      const downloadsFolder = '/tmp';
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        downloadsFolder,
      });

      const onData = jest.fn();
      const onTransform = jest.fn();

      jest.spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtil.generateWritableStream(onData));

      jest.spyOn(uploadHandler, uploadHandler.handleFileBytes.name)
        .mockImplementation(() => TestUtil.generateTransformStream(onTransform));

      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'mockFile.mov'
      };

      await uploadHandler.onFile(...Object.values(params));

      // heydude = heydude (compare readable stream)
      expect(onData.mock.calls.join()).toEqual(chunks.join());
      expect(onTransform.mock.calls.join()).toEqual(chunks.join());

      const expectedFilename = `${uploadHandler.downloadsFolder}/${params.filename}`;
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename);
    });
  });

  describe('#handleFileBytes', () => {
    test('should call emit function and it is a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name);
      jest.spyOn(ioObj, ioObj.emit.name);

      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        downloadsFolder: '/tmp',
      });

      const messages = ['hello'];
      const source = TestUtil.generateReadableStream(messages);
      const onWrite = jest.fn();
      const target = TestUtil.generateWritableStream(onWrite);

      await pipeline(
        source,
        uploadHandler.handleFileBytes('filename.txt'),
        target,
      );

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length);
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length);

      // if handleFileBytes its transform stream, this pipeline continue process
      // and call function sended target chunk
      expect(onWrite).toBeCalledTimes(messages.length);
      expect(onWrite.mock.calls.join()).toEqual(messages.join());
    });
  });
})