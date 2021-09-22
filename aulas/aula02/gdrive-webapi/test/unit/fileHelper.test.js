import { describe, test, expect, jest } from '@jest/globals';
import fs from 'fs';

import FileHelper from '../../src/fileHelper.js';

describe('#FileHelper', () => {
  
  describe('#getFileStatus', () => {
    test('it should return files statuses in correct format', async () => {
      const statMock = {
        dev: 2552715,
        mode: 33206,
        nlink: 1,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 4096,        
        ino: 2251799815036792,
        size: 260856,
        blocks: 512,
        atimeMs: 1631835565378.7588,
        mtimeMs: 1627857927055.5146,
        ctimeMs: 1629634872025.225,
        birthtimeMs: 1631835565344.8499,
        atime: '2021-09-16T23:39:25.379Z',
        mtime: '2021-08-01T22:45:27.056Z',
        ctime: '2021-08-22T12:21:12.025Z',
        birthtime: '2021-09-16T23:39:25.345Z'
      };

      const mockUser = 'cauesantos';
      process.env.USER = mockUser;

      const filename = 'file.png';

      jest.spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValue([filename]);

      jest.spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValue(statMock);

      const result = await FileHelper.getFileStatus('/tmp');

      const expectedResult = [
        {
          size: "261 kB",
          file: filename,
          lastModified: statMock.birthtime,
          owner: mockUser,
        }
      ];

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`);
      expect(result).toMatchObject(expectedResult);
    });
  });
});

