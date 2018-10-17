import mockFs from 'mock-fs'
import os from 'os'
import path from 'path'
import { assert, expect } from 'chai'
import { PackagePath } from 'ern-core'
import { getCodePushSdk, getCodePushInitConfig } from '../src/codepush'
import {
  containsVersionMismatch,
  resolvePluginsVersions,
} from '../src/container'

const ernRcPath = path.join(os.homedir(), '.ern', '.ernrc')
const codePushConfigPath = path.join(
  process.env.LOCALAPPDATA || process.env.HOME || '',
  '.code-push.config'
)
const ernRcCodePushAccessKey = '0e2509c78c4f94c25e69131a0a5e5be3b7d2927b'
const codePushConfigAccessKey = '1e2509c78c4f94c25e69131a0a5e5be3b7d2927b'

const ernRcWithCodePushAccessKey = JSON.stringify({
  codePushAccessKey: ernRcCodePushAccessKey,
})
const codePushConfigWithAccessKey = JSON.stringify({
  accessKey: codePushConfigAccessKey,
})
const ernRcWithoutCodePushAccessKey = JSON.stringify({})
const codePushConfigWithoutAccessKey = JSON.stringify({})

describe('publication.js', () => {
  afterEach(() => {
    mockFs.restore()
  })

  // ==========================================================
  // getCodePushAccessKey
  // ==========================================================
  describe('getCodePushInitConfig', () => {
    it('should return the access key from code push config if keys are present in both config files', () => {
      mockFs(
        {
          [ernRcPath]: ernRcWithCodePushAccessKey,
          [codePushConfigPath]: codePushConfigWithAccessKey,
        },
        {
          createCwd: false,
        }
      )
      expect(getCodePushInitConfig().accessKey).to.be.equal(
        codePushConfigAccessKey
      )
    })

    it('should return the access key from code push config if key is not present in .ernrc', () => {
      mockFs(
        {
          [ernRcPath]: ernRcWithoutCodePushAccessKey,
          [codePushConfigPath]: codePushConfigWithAccessKey,
        },
        {
          createCwd: false,
        }
      )
      expect(getCodePushInitConfig().accessKey).to.be.equal(
        codePushConfigAccessKey
      )
    })

    it('should return undefined if key is not found in .ernrc nor in .code-push.config', () => {
      mockFs(
        {
          [ernRcPath]: ernRcWithoutCodePushAccessKey,
          [codePushConfigPath]: codePushConfigWithoutAccessKey,
        },
        {
          createCwd: false,
        }
      )
      expect(getCodePushInitConfig().accessKey).to.be.undefined
    })

    it('should return undefined if key is not found in .ernrc and .code-push.config does not exist', () => {
      mockFs(
        {
          [ernRcPath]: ernRcWithoutCodePushAccessKey,
        },
        {
          createCwd: false,
        }
      )
      expect(getCodePushInitConfig().accessKey).to.be.undefined
    })
  })

  // ==========================================================
  // getCodePushSdk
  // ==========================================================
  describe('getCodePushSdk', () => {
    it('should not throw if an access key exists', () => {
      mockFs(
        {
          [ernRcPath]: ernRcWithCodePushAccessKey,
          [codePushConfigPath]: codePushConfigWithAccessKey,
        },
        {
          createCwd: false,
        }
      )
      expect(getCodePushSdk).to.not.throw()
    })

    it('should throw if no access key exists', () => {
      mockFs(
        {
          [ernRcPath]: ernRcWithoutCodePushAccessKey,
          [codePushConfigPath]: codePushConfigWithoutAccessKey,
        },
        {
          createCwd: false,
        }
      )
      expect(getCodePushSdk).to.throw()
    })
  })

  // ==========================================================
  // containsVersionMismatch
  // ==========================================================
  const versionsWithAMajorMismatch = ['1.0.0', '2.0.0', '1.0.0']
  const versionsWithAMinorMismatch = ['1.0.0', '1.1.0', '1.0.0']
  const versionsWithAPatchMismatch = ['1.0.0', '1.0.1', '1.0.0']
  const versionsWithoutMismatch = ['1.0.0', '1.0.0', '1.0.0']

  describe('containsVersionMismatch', () => {
    it('should return true if mismatch level is set to major and there is at least one major version mismatch', () => {
      expect(containsVersionMismatch(versionsWithAMajorMismatch, 'major')).true
    })

    it('should return false if mismatch level is set to major and there is no major version mismatch [1]', () => {
      expect(containsVersionMismatch(versionsWithAMinorMismatch, 'major')).false
    })

    it('should return false if mismatch level is set to major and there is no major version mismatch [2]', () => {
      expect(containsVersionMismatch(versionsWithAPatchMismatch, 'major')).false
    })

    it('should return false if mismatch level is set to major and there is no major version mismatch [3]', () => {
      expect(containsVersionMismatch(versionsWithoutMismatch, 'major')).false
    })

    it('should return true if mismatch level is set to minor and there is at least one major version mismatch', () => {
      expect(containsVersionMismatch(versionsWithAMajorMismatch, 'minor')).true
    })

    it('should return true if mismatch level is set to minor and there is at least one minor version mismatch', () => {
      expect(containsVersionMismatch(versionsWithAMinorMismatch, 'minor')).true
    })

    it('should return false if mismatch level is set to minor and there no minor version mismatch [1]', () => {
      expect(containsVersionMismatch(versionsWithAPatchMismatch, 'minor')).false
    })

    it('should return false if mismatch level is set to minor and there no minor version mismatch [1]', () => {
      expect(containsVersionMismatch(versionsWithoutMismatch, 'minor')).false
    })

    it('should return true if mismatch level is set to patch and there is at least one major version mismatch', () => {
      expect(containsVersionMismatch(versionsWithAMajorMismatch, 'patch')).true
    })

    it('should return true if mismatch level is set to patch and there is at least one minor version mismatch', () => {
      expect(containsVersionMismatch(versionsWithAMinorMismatch, 'patch')).true
    })

    it('should return true if mismatch level is set to patch and there is at least one patch version mismatch', () => {
      expect(containsVersionMismatch(versionsWithAPatchMismatch, 'patch')).true
    })

    it('should return false if mismatch level is set to patch and there is no patch version mismatch', () => {
      expect(containsVersionMismatch(versionsWithoutMismatch, 'patch')).false
    })
  })
})
