import EventEmitter from '@metamask/safe-event-emitter';
import ExtensionPlatform from '../platforms/extension';

export const NOTIFICATION_MANAGER_EVENTS = {
  POPUP_CLOSED: 'onPopupClosed',
};

/**
 * A collection of methods for controlling the showing and hiding of the notification popup.
 */
export default class NotificationManager extends EventEmitter {
  constructor() {
    super();
    this.platform = new ExtensionPlatform();
    this.platform.addOnRemovedListener(this._onWindowClosed.bind(this));
  }

  /**
   * Mark the notification popup as having been automatically closed.
   *
   * This lets us differentiate between the cases where we close the
   * notification popup v.s. when the user closes the popup window directly.
   */
  markAsAutomaticallyClosed() {
    this._popupAutomaticallyClosed = true;
  }

  /**
   * Either brings an existing MetaMask notification window into focus, or creates a new notification window. New
   * notification windows are given a 'popup' type.
   *
   * @param {Function} setCurrentPopupId - setter of current popup id from appStateController
   * @param {number} currentPopupId - id of current opened metamask popup window
   */
  async showPopup(setCurrentPopupId, currentPopupId) {
    this._popupId = currentPopupId;
    this._setCurrentPopupId = setCurrentPopupId;
  }

  _onWindowClosed(windowId) {
    if (windowId === this._popupId) {
      this._setCurrentPopupId(undefined);
      this._popupId = undefined;
      this.emit(NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED, {
        automaticallyClosed: this._popupAutomaticallyClosed,
      });
      this._popupAutomaticallyClosed = undefined;
    }
  }

  /**
   * Checks all open MetaMask windows, and returns the first one it finds that is a notification window (i.e. has the
   * type 'popup')
   *
   * @private
   */
  async _getPopup() {
    const windows = await this.platform.getAllWindows();
    return this._getPopupIn(windows);
  }

  /**
   * Given an array of windows, returns the 'popup' that has been opened by MetaMask, or null if no such window exists.
   *
   * @private
   * @param {Array} windows - An array of objects containing data about the open MetaMask extension windows.
   */
  _getPopupIn(windows) {
    return windows
      ? windows.find((win) => {
          // Returns notification popup
          return win && win.type === 'popup' && win.id === this._popupId;
        })
      : null;
  }
}
