const electron = require('electron'),
      path = require('path'),

      appSettings = require('../services/appSettings').appSettings;


/**
 * AppUpdaterAdapter is a bridge between the updater and the electron app.
 * This abstracts the internal implementation of app away from the updater module.
 */
let AppUpdaterAdapter = {

    /**
     * @method getLogger
     * @description It gives the logger instance from the app
     * @return {Logger}
     */
    getLogger () {
      return global.pm.logger || console;
    },

    /**
     * @method getCurrentVersion
     * @description This provides the current version of the app
     * @return {String}
     */
    getCurrentVersion () {
      return electron.app.getVersion();
    },

    getAppName () {
      return electron.app.getName();
    },

    /**
     * @method getDesktopPath
     * @return {String}, returns the desktop path for the current user using electron getPath API
     */
    getDesktopPath () {
      return electron.app.getPath('desktop');
    },

    /**
     * This will return the path of the Postman directory
     *
     * some-folder
     *   postman         <---------- getAppInstallationPath()
     *     app
     *     |  resources
     *     |    app      <----------- electron.app.getAppPath()
     *     |      main.js
     *     |      package.json
     *     postman-xxxxxxxxxx.tar.gz
     *     postman-xxxxxxxxxx-old
     */
    getAppInstallationPath () {
      return path.resolve(electron.app.getAppPath(), '..', '..', '..');
    },

    /**
     * @method getLastKnownVersion
     * @description This helps in getting the last known version saved in app settings
     * @param {Function} cb
     */
    getLastKnownVersion (cb) {
      appSettings.get('lastKnownVersion', cb);
    },

    /**
     * @method getOriginalFs
     * @description It provides the original-fs available in electron
     */
    getOriginalFs () {
      return require('original-fs');
    },

    /**
     * @method setLastKnownVersion
     * @description This helps in setting the last known version to app settings
     * @param {String} version
     */
    setLastKnownVersion (version) {
      appSettings.set('lastKnownVersion', version);
    },

    /**
     * @method getAutoUpdater
     * @description This returns the autoUpdater to be used in updater,
     * at present it sends electron.autoUpdater
     * @return {Object} electron.autoUpdater
     */
    getAutoUpdater () {
      return electron.autoUpdater;
    },

    /**
     * @method setDownloadVersion
     * @description This helps in setting the download version to app settings
     * @param {String} downloadVersion
     */
    setDownloadedVersion (version) {
      appSettings.set('downloadedVersion', version);
    },

    /**
     * @method quitApp
     * @description It returns the electron function to quit the app
     * @returns {Object} electron.app.quit
     */
    quitApp () {
      // Reverting the fix, since it causes issues with the Linux update flow
      // When the user closes the window, it is captured by the electron event `before-quit`
      // and then we apply the update (swap the current and newly downloaded update directory)
      // after that if we call the `electron.app.quit()`, it would re-trigger the electron
      // event `electron.app.quit` recursively. Running the swapping logic multiple times
      // would lead to deletion of the `app` directory breaking future updates as well.
      // https://postmanlabs.atlassian.net/browse/APPSDK-257
      return electron.app.quit;
    }
};

module.exports = AppUpdaterAdapter;
