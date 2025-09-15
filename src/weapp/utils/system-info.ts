/**
 * Polyfill wx.getSystemInfoSync by composing the modern granular APIs.
 *
 * When base library 3.0+ is available, WeChat discourages using the legacy
 * wx.getSystemInfoSync API. Some third-party libraries still call it, so we
 * replace the implementation to avoid deprecation warnings while keeping the
 * returned shape compatible.
 */

const KNOWN_PLATFORMS: ReadonlyArray<WechatMiniprogram.SystemInfo['platform']> = [
  'ios',
  'android',
  'ohos',
  'windows',
  'mac',
  'devtools',
]

const toAuthorizedFlag = (value: unknown): boolean => value === 'authorized'

const normalizePlatform = (value: string | undefined): WechatMiniprogram.SystemInfo['platform'] => {
  return KNOWN_PLATFORMS.includes(value as WechatMiniprogram.SystemInfo['platform'])
    ? (value as WechatMiniprogram.SystemInfo['platform'])
    : 'devtools'
}

const normaliseSafeArea = (
  windowInfo: WechatMiniprogram.WindowInfo,
): WechatMiniprogram.SafeArea => {
  const width = windowInfo.windowWidth ?? 0
  const height = windowInfo.windowHeight ?? 0
  return windowInfo.safeArea ?? {
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
  }
}

const fallbackFontSize = (info: WechatMiniprogram.AppBaseInfo): number => {
  if (typeof info.fontSizeSetting === 'number') {
    return info.fontSizeSetting
  }
  if (typeof info.fontSizeScaleFactor === 'number') {
    return Math.round(16 * info.fontSizeScaleFactor)
  }
  return 16
}

const ensureEssentialApis = (): boolean => {
  return typeof wx.getSystemSetting === 'function'
    && typeof wx.getDeviceInfo === 'function'
    && typeof wx.getWindowInfo === 'function'
    && typeof wx.getAppBaseInfo === 'function'
}

const safeInvoke = <T>(fn: () => T | undefined): T | undefined => {
  try {
    return fn()
  } catch {
    return undefined
  }
}

export const patchSystemInfo = (): void => {
  const original = typeof wx.getSystemInfoSync === 'function'
    ? wx.getSystemInfoSync.bind(wx)
    : undefined

  if (!original || !ensureEssentialApis()) {
    return
  }

  wx.getSystemInfoSync = () => {
    try {
      const systemSetting = safeInvoke(() => wx.getSystemSetting?.())
      const deviceInfo = safeInvoke(() => wx.getDeviceInfo?.())
      const windowInfo = safeInvoke(() => wx.getWindowInfo?.())
      const appBaseInfo = safeInvoke(() => wx.getAppBaseInfo?.())
      const appAuthorizeSetting = safeInvoke(() => wx.getAppAuthorizeSetting?.())

      if (!systemSetting || !deviceInfo || !windowInfo || !appBaseInfo) {
        return original()
      }

      const safeArea = normaliseSafeArea(windowInfo)
      const info: WechatMiniprogram.SystemInfo = {
        SDKVersion: appBaseInfo.SDKVersion ?? '',
        albumAuthorized: toAuthorizedFlag(appAuthorizeSetting?.albumAuthorized),
        benchmarkLevel: typeof deviceInfo.benchmarkLevel === 'number' ? deviceInfo.benchmarkLevel : -1,
        bluetoothEnabled: systemSetting.bluetoothEnabled ?? false,
        brand: deviceInfo.brand ?? '',
        cameraAuthorized: toAuthorizedFlag(appAuthorizeSetting?.cameraAuthorized),
        deviceOrientation: systemSetting.deviceOrientation ?? 'portrait',
        enableDebug: appBaseInfo.enableDebug ?? false,
        fontSizeSetting: fallbackFontSize(appBaseInfo),
        host: { appId: appBaseInfo.host?.appId ?? '' },
        language: appBaseInfo.language ?? '',
        locationAuthorized: toAuthorizedFlag(appAuthorizeSetting?.locationAuthorized),
        locationEnabled: systemSetting.locationEnabled ?? false,
        locationReducedAccuracy: appAuthorizeSetting?.locationReducedAccuracy ?? false,
        microphoneAuthorized: toAuthorizedFlag(appAuthorizeSetting?.microphoneAuthorized),
        model: deviceInfo.model ?? '',
        notificationAlertAuthorized: toAuthorizedFlag(appAuthorizeSetting?.notificationAlertAuthorized),
        notificationAuthorized: toAuthorizedFlag(appAuthorizeSetting?.notificationAuthorized),
        notificationBadgeAuthorized: toAuthorizedFlag(appAuthorizeSetting?.notificationBadgeAuthorized),
        notificationSoundAuthorized: toAuthorizedFlag(appAuthorizeSetting?.notificationSoundAuthorized),
        phoneCalendarAuthorized: toAuthorizedFlag(appAuthorizeSetting?.phoneCalendarAuthorized),
        pixelRatio: windowInfo.pixelRatio ?? 1,
        platform: normalizePlatform(deviceInfo.platform),
        safeArea,
        screenHeight: windowInfo.screenHeight ?? windowInfo.windowHeight ?? 0,
        screenWidth: windowInfo.screenWidth ?? windowInfo.windowWidth ?? 0,
        statusBarHeight: windowInfo.statusBarHeight ?? 0,
        system: deviceInfo.system ?? '',
        version: appBaseInfo.version ?? '',
        wifiEnabled: systemSetting.wifiEnabled ?? false,
        windowHeight: windowInfo.windowHeight ?? 0,
        windowWidth: windowInfo.windowWidth ?? 0,
      }

      if (appBaseInfo.theme) {
        info.theme = appBaseInfo.theme
      }

      return info
    } catch (error) {
      return original()
    }
  }
}
