/*
 *  Copyright 2024 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { AlertProps } from 'antd';
import { create } from 'zustand';

type AlertType = {
  type: AlertProps['type'];
  message: string;
};

interface AlertStore {
  alert: AlertType | undefined;
  animationClass: string;
  addAlert: (alert: AlertType, timer?: number) => void;
  resetAlert: () => void;
}

export const useAlertStore = create<AlertStore>()((set) => ({
  alert: undefined,
  animationClass: '',
  addAlert: (alert: AlertType, timer?: number) => {
    set({ alert, animationClass: 'show-alert' });

    const autoCloseTimer =
      timer !== undefined ? timer : alert.type === 'error' ? Infinity : 5000;

    if (autoCloseTimer !== Infinity) {
      setTimeout(() => {
        set({ animationClass: 'hide-alert' });
        setTimeout(() => {
          set({ alert: undefined });
        }, 300);
      }, autoCloseTimer);
    }
  },
  resetAlert: () => {
    setTimeout(() => {
      set({ alert: undefined });
    }, 300);
  },
}));
