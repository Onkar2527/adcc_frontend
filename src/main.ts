// Intercept token/user Storage operations to redirect them to sessionStorage (cleared on tab/browser close)
const originalGet = Storage.prototype.getItem;
const originalSet = Storage.prototype.setItem;
const originalRemove = Storage.prototype.removeItem;

Storage.prototype.getItem = function (this: Storage, key: string): string | null {
  if (this === localStorage && (key === 'token' || key === 'user')) {
    return sessionStorage.getItem(key);
  }
  return originalGet.apply(this, [key]);
};

Storage.prototype.setItem = function (this: Storage, key: string, value: string): void {
  if (this === localStorage && (key === 'token' || key === 'user')) {
    sessionStorage.setItem(key, value);
    return;
  }
  originalSet.apply(this, [key, value]);
};

Storage.prototype.removeItem = function (this: Storage, key: string): void {
  if (this === localStorage && (key === 'token' || key === 'user')) {
    sessionStorage.removeItem(key);
    return;
  }
  originalRemove.apply(this, [key]);
};

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
